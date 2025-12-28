// lib/askdesign/returnTo.ts

/**
 * 現在URLの pathname + search を返す（クライアント専用）
 */
export function getCurrentPathWithSearch() {
  if (typeof window === 'undefined') return '/';
  const path = window.location.pathname || '/';
  const qs = window.location.search || '';
  return `${path}${qs}`;
}

/**
 * /auth/login?returnTo=... を作る
 */
export function buildLoginUrl(returnTo: string) {
  const rt = sanitizeReturnTo(returnTo) ?? '/';
  return `/auth/login?returnTo=${encodeURIComponent(rt)}`;
}

/**
 * /auth/signup?returnTo=... を作る
 */
export function buildSignupUrl(returnTo: string) {
  const rt = sanitizeReturnTo(returnTo) ?? '/';
  return `/auth/signup?returnTo=${encodeURIComponent(rt)}`;
}

/**
 * returnTo を取り出して「安全な相対パス」に正規化して返す
 * - 不正なら fallback にする（オープンリダイレクト対策）
 *
 * 使い方例:
 *   const sp = useSearchParams();
 *   const returnTo = consumeReturnTo(sp, '/input');
 */
export function consumeReturnTo(
  searchParams?:
    | { get: (key: string) => string | null }
    | URLSearchParams
    | ReadonlyURLSearchParams
    | null,
  fallback = '/input'
) {
  // 1) 引数の searchParams から読む
  const rawFromArg = searchParams?.get?.('returnTo') ?? null;

  // 2) 引数が無い場合は window.location.search から読む
  let raw = rawFromArg;
  if (!raw && typeof window !== 'undefined') {
    try {
      const sp = new URLSearchParams(window.location.search);
      raw = sp.get('returnTo');
    } catch {
      // ignore
    }
  }

  const safe = sanitizeReturnTo(raw);
  return safe ?? fallback;
}

/**
 * returnTo を安全な「同一オリジンの相対パス」に制限する
 * 許可: "/xxx" 形式のみ（"//" や "http(s)://" は拒否）
 */
export function sanitizeReturnTo(raw: string | null | undefined) {
  const s = String(raw ?? '').trim();
  if (!s) return null;

  // 絶対URL / スキーム / 2重スラッシュ を拒否
  if (s.includes('://')) return null;
  if (s.startsWith('//')) return null;

  // 相対パスのみ許可（/ から始まる）
  if (!s.startsWith('/')) return null;

  // 不要ならここでさらに制限（例：ログイン後に行かせたくないパス）
  // if (s.startsWith('/auth')) return '/input';

  return s;
}
