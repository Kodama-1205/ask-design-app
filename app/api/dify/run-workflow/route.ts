// app/api/dify/run-workflow/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // fetch先や環境変数を安定させる

type AnyObj = Record<string, any>;

function pickFirstString(...candidates: any[]): string {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c;
  }
  return '';
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

export async function POST(req: Request) {
  try {
    const baseUrl = (process.env.DIFY_BASE_URL || 'https://api.dify.ai').replace(/\/$/, '');
    const apiKey = process.env.DIFY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing env: DIFY_API_KEY' },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as AnyObj;

    // ここで “入力の最低限” を揃える（フロントの揺れも吸収）
    const inputs: AnyObj = {
      goal: body?.goal ?? '',
      context: body?.context ?? '',
      skill_level: body?.skill_level ?? body?.skillLevel ?? '',
      tools: body?.tools ?? '',
      // 追加で何が来ても一応通す（将来拡張用）
      ...Object.fromEntries(
        Object.entries(body || {}).filter(
          ([k]) => !['goal', 'context', 'skill_level', 'skillLevel', 'tools'].includes(k)
        )
      ),
    };

    // goal は最低限必須（空なら400）
    if (!String(inputs.goal || '').trim()) {
      return NextResponse.json({ error: 'goal is required' }, { status: 400 });
    }

    // Dify Workflow Run API（blocking推奨）
    // ※ Difyの「Workflow App」のAPIキーが前提（workflow_id不要）
    const difyReqBody = {
      inputs,
      response_mode: 'blocking',
      user: body?.user ?? 'askdesign',
    };

    const difyRes = await fetch(`${baseUrl}/v1/workflows/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(difyReqBody),
    });

    const rawText = await difyRes.text();
    const payload = safeJsonParse(rawText);

    // DifyがJSON以外返した場合
    if (!payload) {
      return NextResponse.json(
        {
          error: 'Dify returned non-JSON response',
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
          error: 'Dify API error',
          status: difyRes.status,
          message:
            payload?.message ||
            payload?.error ||
            payload?.detail ||
            'Unknown Dify error',
          dify: payload,
        },
        { status: 502 }
      );
    }

    const { generated_prompt, explanation } = normalizeDifyResponse(payload);

    // 正規化の最終保証：generated_prompt が空なら「どこが返ってないか」情報も添えて返す
    if (!String(generated_prompt).trim()) {
      return NextResponse.json(
        {
          error: 'generated_prompt is empty after normalization',
          hint:
            'DifyのOutputノードで generated_prompt / explanation を出すか、LLMのtextが返る設定になっているか確認してください。',
          dify: payload,
        },
        { status: 502 }
      );
    }

    // ✅ ここが “正規化の本体” ：フロントはこれだけ見れば良い
    return NextResponse.json(
      {
        generated_prompt: String(generated_prompt),
        explanation: String(explanation || ''),
        // デバッグしたい時のために raw を残したいならコメントアウト解除
        // raw: payload,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unknown server error' },
      { status: 500 }
    );
  }
}
