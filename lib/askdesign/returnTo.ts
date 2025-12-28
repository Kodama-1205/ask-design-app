// lib/askdesign/returnTo.ts

/**
 * Next.js の useSearchParams() 互換（ReadonlyURLSearchParamsを型として参照しない）
 */
export type SearchParamsLike =
  | { get: (key: string) => string | null; toString?: () => string }
  | URLSearchParams
  | null
  | undefined;

export function consumeReturnTo(searchParams: SearchParamsLike, fallback = '/input') {
  const value = searchParams?.get?.('returnTo');
  if (!value) return fallback;

  // 外部URLなどへ飛ばない（相対パスのみ許可）
  if (!value.startsWith('/')) return fallback;

  return value;
}

/**
 * 現在のパス + クエリ を組み立てる
 * - pathname: usePathname() の戻り値（例: "/input"）
 * - searchParams: useSearchParams() の戻り値互換（toString() があればそれを使う）
 */
export function getCurrentPathWithSearch(pathname: string, searchParams?: SearchParamsLike) {
  const base = pathname?.startsWith('/') ? pathname : '/';
  const qs = searchParams?.toString?.() ?? '';
  return qs ? `${base}?${qs}` : base;
}

function safeNextPath(nextPath?: string) {
  const p = nextPath ?? '/input';
  return p.startsWith('/') ? p : '/input';
}

export function buildLoginUrl(nextPath = '/input') {
  const sp = new URLSearchParams();
  sp.set('returnTo', safeNextPath(nextPath));
  return `/auth/login?${sp.toString()}`;
}

export function buildSignupUrl(nextPath = '/input') {
  const sp = new URLSearchParams();
  sp.set('returnTo', safeNextPath(nextPath));
  return `/auth/signup?${sp.toString()}`;
}
