'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { createClient } from '../../lib/supabase/client';

function safeReturnTo(raw: string | null) {
  // 変な値や /login ループを避ける（見た目は変えず安全に）
  if (!raw) return '/';
  if (raw.startsWith('/login') || raw.startsWith('/signup')) return '/';
  if (!raw.startsWith('/')) return '/';
  return raw;
}

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
    setReturnTo(safeReturnTo(sp.get('returnTo')));
  }, []);

  // すでにログイン済みなら returnTo へ（ここも full reload で確実に）
  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      if (data?.user) {
        window.location.assign(returnTo);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [returnTo]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    // 10秒経っても進まない場合は解除（無限「ログイン中…」防止）
    const watchdog = window.setTimeout(() => {
      setSubmitting(false);
      setError('ログイン処理が完了しませんでした。通信状況をご確認のうえ、もう一度お試しください。');
    }, 10000);

    try {
      const supabase = createClient();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        window.clearTimeout(watchdog);
        setError(signInError.message);
        setSubmitting(false);
        return;
      }

      // セッションが取れるまで一瞬待つ（cookie反映の取りこぼし防止）
      // 取れなければそれでも次へ進む（full reloadで最終的に整合）
      try {
        await supabase.auth.getSession();
      } catch {
        // noop
      }

      window.clearTimeout(watchdog);

      // ★ここがポイント：router.replace ではなく full reload
      // → proxy.ts 側に cookie が確実に届くので、ログイン判定が安定する
      window.location.assign(returnTo);
    } catch (err: any) {
      window.clearTimeout(watchdog);
      setError(err?.message ?? 'ログインに失敗しました。もう一度お試しください。');
      setSubmitting(false);
    }
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
