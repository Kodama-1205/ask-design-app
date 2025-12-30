'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { createClient } from '../../lib/supabase/client';

export default function LoginClient() {
  const router = useRouter();

  const [returnTo, setReturnTo] = useState('/');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // returnTo はブラウザでだけ取得（ビルド時prerenderで落ちない）
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const rt = sp.get('returnTo');
    if (rt) setReturnTo(rt);
  }, []);

  // すでにログイン済みなら returnTo へ
  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      if (data?.user) router.replace(returnTo);
    })();
    return () => {
      mounted = false;
    };
  }, [router, returnTo]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
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
  );
}
