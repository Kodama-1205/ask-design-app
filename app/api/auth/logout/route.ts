import { NextResponse } from "next/server";
import { getAuthCookieName } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set(getAuthCookieName(), "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
