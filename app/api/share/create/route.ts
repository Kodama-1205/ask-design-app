// app/api/share/create/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type OkPayload = {
  ok: true;
  token: string;
  url: string;
};

type ErrPayload = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

function jsonError(code: string, message: string, status = 400) {
  const payload: ErrPayload = { ok: false, error: { code, message } };
  return NextResponse.json(payload, { status });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return jsonError('BAD_JSON', 'Invalid JSON body', 400);

    // 例：必要な入力（あなたの仕様に合わせて調整）
    const prompt = typeof body.prompt === 'string' ? body.prompt : '';
    if (!prompt) return jsonError('MISSING_PROMPT', 'prompt is required', 400);

    // ✅ ここをあなたの既存ロジックに差し替え
    // - tokenを発行
    // - 保存
    // - URL生成
    const token = crypto.randomUUID().replaceAll('-', '').slice(0, 24);
    const url = `/share/${token}`;

    const okPayload: OkPayload = { ok: true, token, url };
    return NextResponse.json(okPayload, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return jsonError('INTERNAL_ERROR', message, 500);
  }
}
