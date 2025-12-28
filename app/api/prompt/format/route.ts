// app/api/prompt/format/route.ts
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TargetAI = "chatgpt" | "gemini" | "claude";

function isObject(v: any): v is Record<string, any> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function toStr(v: any) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function clamp(s: string, max = 12000) {
  if (s.length <= max) return s;
  return s.slice(0, max) + "\n…(truncated)";
}

function clean(s: string) {
  return clamp(toStr(s).replace(/\r\n/g, "\n").trim(), 24000);
}

function normalizeTarget(t: any): TargetAI | null {
  const s = toStr(t).trim().toLowerCase();
  if (s === "chatgpt") return "chatgpt";
  if (s === "gemini") return "gemini";
  if (s === "claude") return "claude";
  return null;
}

function block(title: string, body: string) {
  const b = clean(body);
  return `## ${title}\n${b || "—"}\n`;
}

function wrapTripleBackticks(body: string) {
  // 連続```が混ざっても壊れないように簡易エスケープ
  const safe = body.replace(/```/g, "``\\`");
  return `\`\`\`\n${safe}\n\`\`\``;
}

function formatForChatGPT(params: {
  title: string;
  generated_prompt: string;
  explanation: string;
}) {
  const { title, generated_prompt, explanation } = params;

  const system = [
    "あなたは一流のプロンプトエンジニアです。",
    "ユーザーの目的達成を最優先に、曖昧点があれば必要最小限の確認質問を行い、足りない情報は明示的な仮定を置いて前進してください。",
    "出力は読みやすいMarkdownで、無駄な前置きはしません。",
  ].join("\n");

  const user = [
    title ? `# ${clean(title)}\n` : "",
    block("GENERATED_PROMPT", wrapTripleBackticks(generated_prompt)),
    explanation ? block("EXPLANATION (参考)", wrapTripleBackticks(explanation)) : "",
    block(
      "お願い",
      [
        "上の GENERATED_PROMPT を最終プロンプトとして整形し、必要なら不足点の質問→仮定の順で補完してください。",
        "最終的に、私が別のAIにそのまま貼れる「完成プロンプト」を提示してください。",
      ].join("\n")
    ),
  ].join("\n");

  return [
    "【ChatGPT 用】",
    "",
    "### System（最初に貼る）",
    wrapTripleBackticks(system),
    "",
    "### User（次に貼る）",
    wrapTripleBackticks(user),
  ].join("\n");
}

function formatForGemini(params: {
  title: string;
  generated_prompt: string;
  explanation: string;
}) {
  const { title, generated_prompt, explanation } = params;

  const header = [
    "【Gemini 用】",
    "",
    title ? `# ${clean(title)}` : "",
    "あなたはプロンプトエンジニアです。以下の指示に従ってください。",
  ]
    .filter(Boolean)
    .join("\n");

  const body = [
    block("GENERATED_PROMPT", wrapTripleBackticks(generated_prompt)),
    explanation ? block("EXPLANATION (参考)", wrapTripleBackticks(explanation)) : "",
    block(
      "OUTPUT INSTRUCTIONS",
      [
        "1) 上の GENERATED_PROMPT を、冗長さを減らしつつ品質を落とさずに整形してください。",
        "2) 曖昧点は「確認質問(最大3つ)」→「仮定(最大5つ)」の順で補完してください。",
        "3) 最終出力は、私が別AIにそのまま貼れる『完成プロンプト』のみを提示してください。",
      ].join("\n")
    ),
  ].join("\n");

  return [header, "", body].join("\n");
}

function formatForClaude(params: {
  title: string;
  generated_prompt: string;
  explanation: string;
}) {
  const { title, generated_prompt, explanation } = params;

  const header = ["【Claude 用】", "", title ? `# ${clean(title)}` : ""].filter(Boolean).join("\n");

  // Claudeは長文の指示でも通るが、構造を固定してコピペ耐性を上げる
  const body = [
    "あなたはプロンプトエンジニアです。以下を満たしてください：",
    "- 曖昧点は必要最小限の質問（最大3つ）で確認し、足りない場合は明示的に仮定して前進する",
    "- 文章は簡潔・高密度、ただし読みやすさを優先",
    "- 最終出力は『完成プロンプト』のみ（前置き不要）",
    "",
    block("GENERATED_PROMPT", wrapTripleBackticks(generated_prompt)),
    explanation ? block("EXPLANATION (参考)", wrapTripleBackticks(explanation)) : "",
    block(
      "TASK",
      [
        "上の GENERATED_PROMPT を最終プロンプトとして整形し、必要なら質問→仮定で補完したうえで、",
        "私が別AIに貼れる『完成プロンプト』を出力してください。",
      ].join("\n")
    ),
  ].join("\n");

  return [header, "", body].join("\n");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!isObject(body)) {
      return apiError(400, "BAD_REQUEST", "Invalid JSON body.");
    }

    const target = normalizeTarget(body.target);
    if (!target) {
      return apiError(400, "BAD_REQUEST", "`target` must be one of: chatgpt | gemini | claude");
    }

    const generated_prompt = clean(body.generated_prompt);
    const explanation = clean(body.explanation);
    const title = clean(body.title);

    if (!generated_prompt) {
      return apiError(400, "BAD_REQUEST", "`generated_prompt` is required.");
    }

    const formatted_prompt =
      target === "chatgpt"
        ? formatForChatGPT({ title, generated_prompt, explanation })
        : target === "gemini"
          ? formatForGemini({ title, generated_prompt, explanation })
          : formatForClaude({ title, generated_prompt, explanation });

    return NextResponse.json({
      ok: true,
      target,
      formatted_prompt,
    });
  } catch (e: any) {
    return apiError(500, "INTERNAL_ERROR", "Unexpected error.", e?.message ?? String(e));
  }
}
