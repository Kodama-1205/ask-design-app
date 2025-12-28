// lib/askdesign/returnTo.ts

/**
 * Next.js の useSearchParams()（ReadonlyURLSearchParams）でも、
 * URLSearchParams / { get() } でも受け取れるようにした安全なヘルパ。
 */
export type SearchParamsLike =
  | { get: (key: string) => string | null }
  | URLSearchParams
  | null
  | undefined;

export function consumeReturnTo(
  searchParams: SearchParamsLike,
  fallback = '/input'
) {
  const value = searchParams?.get?.('returnTo');
  if (!value) return fallback;

  // 余計なホストへ飛ばないように簡易ガード（相対パスのみ許可）
  if (!value.startsWith('/')) return fallback;

  return value;
}

export function buildLoginUrl(nextPath = '/input') {
  // ログイン後に戻るための returnTo を付与
  const sp = new URLSearchParams();
  sp.set('returnTo', nextPath.startsWith('/') ? nextPath : '/input');
  return `/auth/login?${sp.toString()}`;
}

export function buildSignupUrl(nextPath = '/input') {
  const sp = new URLSearchParams();
  sp.set('returnTo', nextPath.startsWith('/') ? nextPath : '/input');
  return `/auth/signup?${sp.toString()}`;
}
