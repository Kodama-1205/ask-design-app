// app/api/dify/run-workflow/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // fetch先や環境変数を安定させる

type AnyObj = Record<string, any>;

function pickFirstString(...candidates: any[]): string {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c;
  }
  return "";
}

function normalizeDifyResponse(payload: AnyObj) {
  // Difyレスポンスの “ゆれ” を全部拾う
  const generated_prompt = pickFirstString(
    payload?.generated_prompt,
    payload?.outputs?.generated_prompt,
    payload?.data?.outputs?.generated_prompt,
    payload?.data?.generated_prompt,
    payload?.answer, // chat系の名残
    payload?.data?.answer,
    payload?.text, // テキスト系の名残
    payload?.data?.text
  );

  const explanation = pickFirstString(
    payload?.explanation,
    payload?.outputs?.explanation,
    payload?.data?.outputs?.explanation,
    payload?.data?.explanation
  );

  return { generated_prompt, explanation };
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** x-forwarded-for 優先で IP 推定 */
function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr.trim();
  return "unknown";
}

/** DEMOモード：普段は課金0で固定出力 */
function isDemoMode() {
  return (process.env.DEMO_MODE ?? "").toLowerCase() === "true";
}

/**
 * 合言葉トークン（ポートフォリオ用）
 * - 本番（Vercel）では必須にするのが安全
 * - ローカル開発は未設定でも動くようにする
 */
function requirePortfolioToken(req: Request) {
  const isProd = process.env.NODE_ENV === "production";
  const token = process.env.PORTFOLIO_TOKEN ?? "";

  if (!isProd) {
    // devでは未設定でもOK（作業が止まらないように）
    if (!token) return { ok: true as const };
  } else {
    // 本番では未設定だと危険なので止める
    if (!token) {
      return {
        ok: false as const,
        status: 500,
        error: "Missing env: PORTFOLIO_TOKEN",
      };
    }
  }

  if (!token) return { ok: true as const };

  const incoming =
    req.headers.get("x-portfolio-token") ||
    req.headers.get("X-PORTFOLIO-TOKEN") ||
    "";

  if (incoming !== token) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  return { ok: true as const };
}

/**
 * 依存なしの簡易レート制限（1IPあたり、60秒で max 回）
 * ※サーバレスの特性上「完全」ではないが、連打対策として効果はあります。
 */
const GLOBAL_KEY = "__ASKDESIGN_RL__";
type Bucket = { ts: number[] };

function getBucketStore(): Map<string, Bucket> {
  const g = globalThis as any;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = new Map<string, Bucket>();
  return g[GLOBAL_KEY] as Map<string, Bucket>;
}

function rateLimit(ip: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const store = getBucketStore();
  const key = `run-workflow:${ip}`;

  const b = store.get(key) ?? { ts: [] };
  // 古いものを捨てる
  b.ts = b.ts.filter((t) => now - t < windowMs);

  if (b.ts.length >= limit) {
    store.set(key, b);
    const resetInMs = windowMs - (now - b.ts[0]);
    return { ok: false as const, retryAfterSec: Math.ceil(resetInMs / 1000) };
  }

  b.ts.push(now);
  store.set(key, b);
  return { ok: true as const };
}

/** 入力サイズ制限（高額化＆DoS対策） */
function enforceInputLimits(inputs: AnyObj) {
  const MAX_GOAL = 800; // 目標は短めで十分
  const MAX_CONTEXT = 3000;
  const MAX_TOOLS = 1200;
  const MAX_TOTAL = 5000;

  const goal = String(inputs.goal ?? "");
  const context = String(inputs.context ?? "");
  const tools = String(inputs.tools ?? "");
  const skill = String(inputs.skill_level ?? "");

  if (!goal.trim()) return { ok: false as const, status: 400, error: "goal is required" };
  if (goal.length > MAX_GOAL) return { ok: false as const, status: 400, error: `goal is too long (max ${MAX_GOAL})` };
  if (context.length > MAX_CONTEXT) return { ok: false as const, status: 400, error: `context is too long (max ${MAX_CONTEXT})` };
  if (tools.length > MAX_TOOLS) return { ok: false as const, status: 400, error: `tools is too long (max ${MAX_TOOLS})` };
  if (skill.length > 200) return { ok: false as const, status: 400, error: "skill_level is too long (max 200)" };

  // 全体上限（将来拡張で他のキーが増えても守れる）
  const totalLen = goal.length + context.length + tools.length + skill.length;
  if (totalLen > MAX_TOTAL) {
    return { ok: false as const, status: 400, error: `total input is too large (max ${MAX_TOTAL})` };
  }

  return { ok: true as const };
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);

    // ① DEMOモード（普段は課金0）
    if (isDemoMode()) {
      return NextResponse.json(
        {
          generated_prompt:
            "【デモ】要件を整理し、最小ルートで動く形に落とし込むための質問テンプレートを生成しました。",
          explanation:
            "これはデモモードの固定出力です。見せたい時だけ DEMO_MODE=false にして本番呼び出しに切り替えてください。",
        },
        { status: 200 }
      );
    }

    // ② 合言葉トークン（本番で必須）
    const tokenCheck = requirePortfolioToken(req);
    if (!tokenCheck.ok) {
      return NextResponse.json({ error: tokenCheck.error }, { status: tokenCheck.status });
    }

    // ③ レート制限（連打対策）
    const rl = rateLimit(ip, 5, 60_000); // 1分5回（必要なら調整）
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const baseUrl = (process.env.DIFY_BASE_URL || "https://api.dify.ai").replace(/\/$/, "");
    const apiKey = process.env.DIFY_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing env: DIFY_API_KEY" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as AnyObj;

    // ここで “入力の最低限” を揃える（フロントの揺れも吸収）
    const inputs: AnyObj = {
      goal: body?.goal ?? "",
      context: body?.context ?? "",
      skill_level: body?.skill_level ?? body?.skillLevel ?? "",
      tools: body?.tools ?? "",
      // 追加で何が来ても一応通す（将来拡張用）
      ...Object.fromEntries(
        Object.entries(body || {}).filter(
          ([k]) => !["goal", "context", "skill_level", "skillLevel", "tools"].includes(k)
        )
      ),
    };

    // ④ 入力サイズ制限（高額化＆DoS対策）
    const limitCheck = enforceInputLimits(inputs);
    if (!limitCheck.ok) {
      return NextResponse.json({ error: limitCheck.error }, { status: limitCheck.status });
    }

    // Dify Workflow Run API（blocking推奨）
    const difyReqBody = {
      inputs,
      response_mode: "blocking",
      user: body?.user ?? "askdesign",
    };

    const difyRes = await fetch(`${baseUrl}/v1/workflows/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(difyReqBody),
    });

    const rawText = await difyRes.text();
    const payload = safeJsonParse(rawText);

    // DifyがJSON以外返した場合
    if (!payload) {
      return NextResponse.json(
        {
          error: "Dify returned non-JSON response",
          status: difyRes.status,
          raw: rawText.slice(0, 2000),
        },
        { status: 502 }
      );
    }

    // Dify側エラー（例：401/429/500等）
    if (!difyRes.ok) {
      return NextResponse.json(
        {
          error: "Dify API error",
          status: difyRes.status,
          message: payload?.message || payload?.error || payload?.detail || "Unknown Dify error",
          dify: payload,
        },
        { status: 502 }
      );
    }

    const { generated_prompt, explanation } = normalizeDifyResponse(payload);

    // 正規化の最終保証：generated_prompt が空なら詳細付きで返す
    if (!String(generated_prompt).trim()) {
      return NextResponse.json(
        {
          error: "generated_prompt is empty after normalization",
          hint:
            "DifyのOutputノードで generated_prompt / explanation を出すか、LLMのtextが返る設定になっているか確認してください。",
          dify: payload,
        },
        { status: 502 }
      );
    }

    // ✅ フロントはこれだけ見ればOK
    return NextResponse.json(
      {
        generated_prompt: String(generated_prompt),
        explanation: String(explanation || ""),
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown server error" }, { status: 500 });
  }
}
