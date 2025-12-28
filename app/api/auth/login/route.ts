// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export const runtime = 'nodejs';

type OkPayload = {
  ok: true;
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

    const email = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email) return jsonError('MISSING_EMAIL', 'email is required', 400);
    if (!password) return jsonError('MISSING_PASSWORD', 'password is required', 400);

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return jsonError('AUTH_FAILED', error.message, 401);
    }

    const okPayload: OkPayload = { ok: true };
    return NextResponse.json(okPayload, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return jsonError('INTERNAL_ERROR', msg, 500);
  }
}
