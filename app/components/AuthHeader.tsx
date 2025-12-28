'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { buildLoginUrl, buildSignupUrl, getCurrentPathWithSearch } from '../../lib/askdesign/returnTo';
import styles from './AuthHeader.module.css';

type UserState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; email?: string | null };

export default function AuthHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const supabase = useMemo(() => createClient(), []);

  const [userState, setUserState] = useState<UserState>({ status: 'loading' });

  const safeNextPath = useMemo(() => {
    if (!pathname) return '/input';
    if (pathname.startsWith('/auth')) return '/input';
    // ✅ 引数必須：pathname と searchParams を渡す
    return getCurrentPathWithSearch(pathname, searchParams);
  }, [pathname, searchParams]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;

        const user = data?.user;
        if (!user) {
          setUserState({ status: 'signedOut' });
          return;
        }
        setUserState({ status: 'signedIn', email: user.email });
      } catch {
        if (!mounted) return;
        setUserState({ status: 'signedOut' });
      }
    };

    run();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      run();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const onLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden>
            ✨
          </span>
          <span className={styles.brandText}>Ask Design</span>
        </Link>

        <div className={styles.right}>
          {userState.status === 'loading' ? (
            <div className={styles.skeleton} />
          ) : userState.status === 'signedIn' ? (
            <div className={styles.userBox}>
              <span className={styles.userEmail}>{userState.email ?? 'Signed in'}</span>
              <button className={styles.buttonSecondary} onClick={onLogout}>
                ログアウト
              </button>
            </div>
          ) : (
            <div className={styles.authBox}>
              <Link className={styles.buttonSecondary} href={buildLoginUrl(safeNextPath)}>
                ログイン
              </Link>
              <Link className={styles.buttonPrimary} href={buildSignupUrl(safeNextPath)}>
                新規登録
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
