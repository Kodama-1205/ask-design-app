// app/api/share/get/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { apiError } from "@/lib/api/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing SUPABASE env vars");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function isObj(v: any): v is Record<string, any> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!isObj(body)) return apiError(400, "BAD_REQUEST", "Invalid JSON body.");

    const token = String(body.token ?? "").trim();
    if (!token) return apiError(400, "BAD_REQUEST", "`token` is required.");

    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("ask_design_shares")
      .select("token,title,generated_prompt,explanation,created_at")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      return apiError(500, "DB_ERROR", "Failed to load share.", error.message);
    }
    if (!data) {
      return apiError(404, "NOT_FOUND", "Share not found.");
    }

    return NextResponse.json({ ok: true, share: data });
  } catch (e: any) {
    return apiError(500, "INTERNAL_ERROR", "Unexpected error.", e?.message ?? String(e));
  }
}
