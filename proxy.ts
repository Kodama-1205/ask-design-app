import { NextResponse, type NextRequest } from "next/server";

// 公開運用に合わせ、認証ゲート（Basic / Supabaseログイン強制）は無効化。
// UIやルーティング構造は変えず、全リクエストをそのまま通す。
export async function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
