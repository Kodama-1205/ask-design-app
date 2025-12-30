'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import styles from './AuthHeader.module.css';

export default function AuthHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setEmail(data?.user?.email ?? null);
      setLoading(false);
    };

    load();

    // 画面遷移/復帰でも同期が取れるように（軽量）
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [supabase]);

  const onLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setLoggingOut(false);
      // 見た目は変えず、状態だけ最新化
      router.refresh();
      // もし保護ページに居たらTOPへ（不自然な表示を避ける）
      if (pathname.startsWith('/input') || pathname.startsWith('/result') || pathname.startsWith('/templates') || pathname.startsWith('/template')) {
        router.replace('/');
      }
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/">
          Ask Design
        </Link>

        <div className={styles.right}>
          {!loading && email ? (
            <div className={styles.userPill} aria-label="signed-in-user">
              <span className={styles.userEmail} title={email}>
                {email}
              </span>
              <button
                type="button"
                className={styles.logoutBtn}
                onClick={onLogout}
                disabled={loggingOut}
              >
                {loggingOut ? 'ログアウト中…' : 'ログアウト'}
              </button>
            </div>
          ) : (
            <div className={styles.rightSpacer} />
          )}
        </div>
      </div>
    </header>
  );
}
