// proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// 未ログイン時にログイン必須にしたいパス（UIは変えず、遷移だけ制御）
const PROTECTED_PREFIXES = ["/input", "/result", "/templates", "/template"];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function buildReturnTo(req: NextRequest) {
  return `${req.nextUrl.pathname}${req.nextUrl.search}`;
}

/** Basic認証 */
const BASIC_REALM = "Protected";

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${BASIC_REALM}", charset="UTF-8"`,
    },
  });
}

function decodeBasic(base64: string) {
  try {
    if (typeof atob === "function") return atob(base64);
  } catch {}
  try {
    // eslint-disable-next-line no-undef
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function checkBasicAuth(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER ?? "";
  const pass = process.env.BASIC_AUTH_PASS ?? "";

  // 未設定なら認証しない（本番はVercelに必ず設定）
  if (!user || !pass) return { ok: true as const };

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return { ok: false as const };

  const b64 = auth.slice("Basic ".length).trim();
  const decoded = decodeBasic(b64);
  const [u, p] = decoded.split(":");

  if (u === user && p === pass) return { ok: true as const };
  return { ok: false as const };
}

/** アセット系はBasic認証をかけない（CSS/JSが読めずUIが崩れるのを防ぐ） */
function isPublicAssetPath(pathname: string) {
  if (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml")
  ) {
    return true;
  }

  // 拡張子での除外（念のため）
  return /\.(?:css|js|map|ico|svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|eot)$/.test(pathname);
}

// Next.js 16: middleware.ts の代わりに proxy.ts / proxy() を使う
export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // ① 先にアセットを素通り（ここが今回の“見た目崩れ”対策の本体）
  if (isPublicAssetPath(pathname)) {
    return NextResponse.next();
  }

  // ② Basic認証（ページ/API本体だけ守る）
  const basic = checkBasicAuth(req);
  if (!basic.ok) return unauthorized();

  // ③ 以降は既存のSupabase認証（あなたの現状ロジックを維持）
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 環境変数が無い場合は壊さず素通り
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let res = NextResponse.next();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  // ログイン状態チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 例外：ログイン/サインアップは保護しない（無限ループ防止）
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return res;
  }

  // 未ログインで /input 等に来たらログインへ
  if (!user && isProtectedPath(pathname)) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("returnTo", buildReturnTo(req));

    const redirectRes = NextResponse.redirect(loginUrl);

    // res 側の cookie 更新があれば引き継ぐ（保険）
    res.cookies.getAll().forEach((c) => {
      redirectRes.cookies.set(c.name, c.value);
    });

    return redirectRes;
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
