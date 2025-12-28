// app/api/templates/share/revoke/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyObj = Record<string, any>;

function jsonError(message: string, status: number, extra?: AnyObj) {
  return NextResponse.json({ ok: false, error: message, ...(extra ?? {}) }, { status });
}

function toCleanString(v: any) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) return jsonError("Auth error.", 401, { detail: authError.message });
  if (!user) return jsonError("Unauthorized.", 401);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const token = toCleanString(body?.token);
  if (!token) return jsonError("`token` is required.", 400);

  const { error: upErr } = await supabase
    .from("template_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token", token)
    .eq("user_id", user.id)
    .is("revoked_at", null);

  if (upErr) return jsonError("Failed to revoke share link.", 500, { detail: upErr.message });

  return NextResponse.json({ ok: true, revoked: true });
}
