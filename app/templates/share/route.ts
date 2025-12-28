// app/api/templates/share/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

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

function makeToken() {
  // URL安全なトークン
  return crypto.randomBytes(24).toString("base64url");
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

  const template_id = toCleanString(body?.template_id);
  const reuse_existing = body?.reuse_existing === true;

  if (!template_id) return jsonError("`template_id` is required.", 400);

  // テンプレ所有確認（RLSで守られている前提）
  const { data: tRow, error: tErr } = await supabase
    .from("templates")
    .select("id, user_id")
    .eq("id", template_id)
    .single();

  if (tErr || !tRow) return jsonError("Template not found.", 404);
  if (tRow.user_id !== user.id) return jsonError("Forbidden.", 403);

  if (reuse_existing) {
    const { data: existing } = await supabase
      .from("template_shares")
      .select("token, revoked_at")
      .eq("template_id", template_id)
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    const token = existing?.[0]?.token;
    if (token) {
      return NextResponse.json({
        ok: true,
        token,
        share_url: `/share/${token}`,
        reused: true,
      });
    }
  }

  const token = makeToken();

  const { error: insErr } = await supabase.from("template_shares").insert({
    template_id,
    user_id: user.id,
    token,
  });

  if (insErr) return jsonError("Failed to create share link.", 500, { detail: insErr.message });

  return NextResponse.json({
    ok: true,
    token,
    share_url: `/share/${token}`,
    reused: false,
  });
}
