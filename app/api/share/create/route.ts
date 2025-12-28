// app/api/share/create/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { apiError } from "@/lib/api/errors";
import crypto from "crypto";

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

function toStr(v: any) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function clean(s: string, max = 24000) {
  const x = toStr(s).replace(/\r\n/g, "\n").trim();
  return x.length <= max ? x : x.slice(0, max) + "\n…(truncated)";
}

function makeToken() {
  return crypto.randomBytes(16).toString("hex"); // 32 chars
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!isObj(body)) return apiError(400, "BAD_REQUEST", "Invalid JSON body.");

    const title = clean(body.title ?? "", 200);
    const generated_prompt = clean(body.generated_prompt ?? "");
    const explanation = clean(body.explanation ?? "");

    if (!generated_prompt) {
      return apiError(400, "BAD_REQUEST", "`generated_prompt` is required.");
    }

    const token = makeToken();

    const sb = supabaseAdmin();
    const { error } = await sb.from("ask_design_shares").insert({
      token,
      title: title || null,
      generated_prompt,
      explanation: explanation || null,
    });

    if (error) {
      return apiError(
        500,
        "DB_ERROR",
        "Failed to create share.",
        `${error.message}${error.details ? ` / ${error.details}` : ""}`
      );
    }

    return NextResponse.json({
      ok: true,
      token,
      url: `/share/${token}`,
    });
  } catch (e: any) {
    return apiError(500, "INTERNAL_ERROR", "Unexpected error.", e?.message ?? String(e));
  }
}
