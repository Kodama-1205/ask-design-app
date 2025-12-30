// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// 未ログイン時にログイン必須にしたいパス（UIは変えず、遷移だけ制御）
const PROTECTED_PREFIXES = ['/input', '/result', '/templates', '/template'];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function buildReturnTo(req: NextRequest) {
  // 元の遷移先をそのまま戻せるようにする
  return `${req.nextUrl.pathname}${req.nextUrl.search}`;
}

export async function middleware(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 環境変数が無い場合は、挙動を壊さず素通り
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

  // セッション更新＆ユーザー取得（未ログイン判定）
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = req.nextUrl.pathname;

  // 例外：ログイン関連は保護しない（無限ループ防止）
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    return res;
  }

  // 未ログインで /input 等に来たらログインへ
  if (!user && isProtectedPath(pathname)) {
    const loginUrl = req.nextUrl.clone();

    // ★ログインページが /login ではない場合はここだけ実パスに変更
    loginUrl.pathname = '/login';

    loginUrl.searchParams.set('returnTo', buildReturnTo(req));

    const redirectRes = NextResponse.redirect(loginUrl);

    // res に付いた cookie があれば引き継ぐ（保険）
    res.cookies.getAll().forEach((c) => {
      redirectRes.cookies.set(c.name, c.value);
    });

    return redirectRes;
  }

  return res;
}

export const config = {
  matcher: [
    // next の静的ファイル等は除外
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
