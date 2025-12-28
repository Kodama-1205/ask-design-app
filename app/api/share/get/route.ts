// app/api/share/get/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type SharePayload = {
  token: string;
  title: string | null;
  generated_prompt: string | null;
  explanation: string | null;
  created_at: string | null;
};

type OkPayload = {
  ok: true;
  share: SharePayload;
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

    const token = typeof body.token === 'string' ? body.token : '';
    if (!token) return jsonError('MISSING_TOKEN', 'token is required', 400);

    // ✅ ここをあなたの既存ロジックに差し替え（DBからshareを取得）
    // const share = await getShareByToken(token);
    // if (!share) return jsonError('NOT_FOUND', 'share not found', 404);

    // 仮データ（ビルド通すため）
    const share: SharePayload = {
      token,
      title: null,
      generated_prompt: null,
      explanation: null,
      created_at: new Date().toISOString(),
    };

    const okPayload: OkPayload = { ok: true, share };
    return NextResponse.json(okPayload, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return jsonError('INTERNAL_ERROR', message, 500);
  }
}
