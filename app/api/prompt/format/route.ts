// app/api/prompt/format/route.ts
import { NextResponse } from 'next/server';
// 既存の型/関数を使ってOK
// import type { ApiErrorPayload } from '@/lib/...'
// import { formatPrompt } from '@/lib/...'

export const runtime = 'nodejs'; // edge でも良いが、まずは安定の nodejs 推奨

type TargetAI = 'chatgpt' | 'gemini' | 'claude' | 'other'; // あなたの定義に合わせてOK

type OkPayload = {
  ok: true;
  target: TargetAI;
  formatted_prompt: string;
};

type ErrPayload = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

// ✅ 重要：エラーも必ず NextResponse.json で返す
function jsonError(code: string, message: string, status = 400) {
  const payload: ErrPayload = { ok: false, error: { code, message } };
  return NextResponse.json(payload, { status });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return jsonError('BAD_JSON', 'Invalid JSON body', 400);
    }

    // 例：必要項目チェック（あなたの仕様に合わせて調整）
    const target = body.target as TargetAI | undefined;
    const prompt = body.prompt as string | undefined;

    if (!target) return jsonError('MISSING_TARGET', 'target is required', 400);
    if (!prompt) return jsonError('MISSING_PROMPT', 'prompt is required', 400);

    // ✅ あなたの既存ロジックに差し替え
    // const formatted = await formatPrompt({ target, prompt, ...body });
    const formatted = String(prompt); // 仮：ビルド通すための最低限

    const okPayload: OkPayload = {
      ok: true,
      target,
      formatted_prompt: formatted,
    };

    return NextResponse.json(okPayload, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return jsonError('INTERNAL_ERROR', message, 500);
  }
}
