// app/components/AuthHeader.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { buildLoginUrl, buildSignupUrl, getCurrentPathWithSearch } from '../../lib/askdesign/returnTo';
import styles from './AuthHeader.module.css';

type UserState =
  | { status: 'loading' }
  | { status: 'guest' }
  | { status: 'authed'; email?: string | null };

const NAV_ITEMS = [
  { href: '/input', label: '/input' },
  { href: '/templates', label: '/templates' },
  { href: '/result', label: '/result' },
] as const;

export default function AuthHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [userState, setUserState] = useState<UserState>({ status: 'loading' });

  const returnTo = useMemo(() => {
    if (!pathname) return '/input';
    if (pathname.startsWith('/auth')) return '/input';
    return getCurrentPathWithSearch();
  }, [pathname]);

  useEffect(() => {
    let mounted = true;

    const syncUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;

        if (!mounted) return;

        if (!user) setUserState({ status: 'guest' });
        else setUserState({ status: 'authed', email: user.email });
      } catch {
        if (!mounted) return;
        setUserState({ status: 'guest' });
      }
    };

    syncUser();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      syncUser();
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const activeHref = useMemo(() => {
    // /templates/xxx とかを今後作っても拾えるように startsWith に寄せる
    const p = pathname || '';
    const hit = NAV_ITEMS.find((x) => p === x.href || p.startsWith(`${x.href}/`));
    return hit?.href ?? null;
  }, [pathname]);

  return (
    <div className={styles.wrap}>
      {/* Left: Brand */}
      <div className={styles.left}>
        <Link className={styles.brand} href="/">
          <span className={styles.logo} aria-hidden>
            <span className={styles.logoDot} />
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>Ask Design</span>
            <span className={styles.brandSub}>Prompt Generator</span>
          </span>
        </Link>
      </div>

      {/* Right: Nav + Auth */}
      <div className={styles.right}>
        {/* Nav (ログイン中のみ表示) */}
        <div className={styles.nav}>
          {userState.status === 'authed' &&
            NAV_ITEMS.map((x) => {
              const isActive = activeHref === x.href;
              return (
                <button
                  key={x.href}
                  type="button"
                  onClick={() => router.push(x.href)}
                  className={isActive ? styles.navActive : styles.navBtn}
                  disabled={isActive}
                  title={isActive ? '現在のページ' : x.label}
                >
                  {x.label}
                </button>
              );
            })}
        </div>

        {/* User pill */}
        <div className={styles.userPill}>
          {userState.status === 'loading' && (
            <span className={styles.userLabel}>認証確認中…</span>
          )}

          {userState.status === 'guest' && (
            <>
              <span className={styles.userLabel}>ゲスト</span>
              <div className={styles.actions}>
                <Link className={styles.btnGhost} href={buildLoginUrl(returnTo)}>
                  ログイン
                </Link>
                <Link className={styles.btnPrimary} href={buildSignupUrl(returnTo)}>
                  新規登録
                </Link>
              </div>
            </>
          )}

          {userState.status === 'authed' && (
            <>
              <span className={styles.userLabel} title={userState.email ?? ''}>
                <span className={styles.userDot} aria-hidden />
                <span className={styles.userEmail}>
                  {userState.email ? userState.email : 'ログイン中'}
                </span>
              </span>

              <div className={styles.actions}>
                <button className={styles.btnPrimary} type="button" onClick={logout}>
                  ログアウト
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
