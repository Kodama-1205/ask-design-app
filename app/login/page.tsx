'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthHeader from '../components/AuthHeader';
import styles from './page.module.css';
import { createClient } from '../../lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const returnTo = searchParams.get('returnTo') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // すでにログイン済みなら returnTo へ
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      if (data?.user) router.replace(returnTo);
    })();
    return () => {
      mounted = false;
    };
  }, [router, returnTo, supabase]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setSubmitting(false);
      return;
    }

    router.replace(returnTo);
  };

  return (
    <div className={styles.page}>
      <AuthHeader />

      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.head}>
            <h1 className={styles.title}>ログイン</h1>
            <p className={styles.subtitle}>続行するにはログインしてください</p>
          </div>

          <form className={styles.form} onSubmit={onSubmit}>
            <label className={styles.label}>
              <span className={styles.labelText}>メールアドレス</span>
              <input
                className={styles.input}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <label className={styles.label}>
              <span className={styles.labelText}>パスワード</span>
              <input
                className={styles.input}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>

            {error ? <div className={styles.error}>{error}</div> : null}

            <button className={styles.primaryBtn} type="submit" disabled={submitting}>
              {submitting ? 'ログイン中…' : 'ログイン'}
            </button>

            <div className={styles.metaRow}>
              <div className={styles.metaLeft}>
                <span className={styles.metaText}>アカウントをお持ちでない場合：</span>
                <Link className={styles.link} href={`/signup?returnTo=${encodeURIComponent(returnTo)}`}>
                  新規登録
                </Link>
              </div>

              <Link className={styles.linkMuted} href="/">
                TOPへ戻る
              </Link>
            </div>
          </form>
        </div>
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerText}>Ask Design</span>
      </footer>
    </div>
  );
}
