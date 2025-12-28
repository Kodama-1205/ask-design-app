import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, getAuthCookieName } from "@/lib/auth";

function hash(pw: string) {
  // 最小構成（本番はbcrypt等に置換推奨）
  return Buffer.from(pw).toString("base64");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || password.length < 6) {
      return NextResponse.json({ message: "email と password(6文字以上) が必要です" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ message: "このメールは既に登録されています" }, { status: 409 });

    const user = await prisma.user.create({ data: { email, password: hash(password) } });
    const token = await signToken({ userId: user.id, email: user.email });

    const res = NextResponse.json({ ok: true }, { status: 200 });
    res.cookies.set(getAuthCookieName(), token, { httpOnly: true, sameSite: "lax", path: "/" });
    return res;
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "register failed" }, { status: 500 });
  }
}
