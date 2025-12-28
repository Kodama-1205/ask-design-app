// app/api/share/get-template/route.ts
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

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const token = toCleanString(body?.token);
  if (!token) return jsonError("`token` is required.", 400);

  // share行は anon に公開していないため、server（service roleではなく）でも読めない場合がある
  // そのため、ここは「authenticated不要」だが、RLSが効いて読めない可能性がある。
  // → 解決策：Supabase側で `templates` を public_view に複製するのではなく、share取得だけをRPCにする等。
  // 今回は「server.ts が service role を使う運用」を前提にする。
  // （createClient() が service role を使っていない場合は、server clientを service role版に差し替えてください。）

  const { data: share, error: sErr } = await supabase
    .from("template_shares")
    .select("template_id, revoked_at")
    .eq("token", token)
    .single();

  if (sErr || !share) return jsonError("Share link not found.", 404);
  if (share.revoked_at) return jsonError("Share link revoked.", 410);

  const { data: tpl, error: tErr } = await supabase
    .from("templates")
    .select("id, title, description, body_markdown, updated_at")
    .eq("id", share.template_id)
    .single();

  if (tErr || !tpl) return jsonError("Template not found.", 404);

  return NextResponse.json({
    ok: true,
    template: tpl,
  });
}
