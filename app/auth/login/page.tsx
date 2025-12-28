// app/auth/login/page.tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import { createClient } from '../../../lib/supabase/client';
import { consumeReturnTo, buildSignupUrl } from '../../../lib/askdesign/returnTo';

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const supabase = createClient();

  const returnTo = useMemo(() => consumeReturnTo(sp, '/input'), [sp]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');

    if (!email.trim()) {
      setError('メールアドレスを入力してください');
      return;
    }
    if (!password.trim()) {
      setError('パスワードを入力してください');
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      // ✅ ログイン成功 → 元ページへ
      router.push(returnTo);
    } catch (e: any) {
      setError(e?.message ?? 'ログインに失敗しました');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Ask Design</h1>
            <p className={styles.sub}>Prompt Generator</p>
          </div>

          <div className={styles.headerActions}>
            <Link className={styles.btnGhost} href="/">
              TOP
            </Link>
            <Link className={styles.btnGhost} href={buildSignupUrl(returnTo)}>
              新規登録
            </Link>
          </div>
        </header>

        <section className={styles.card}>
          <div className={styles.toolbar}>
            <div className={styles.toolbarTitle}>ログイン</div>
            <div className={styles.toolbarActions}>
              <Link className={styles.btnGhost} href={buildSignupUrl(returnTo)}>
                アカウント作成
              </Link>
            </div>
          </div>

          <label className={styles.label}>メールアドレス</label>
          <input
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            inputMode="email"
            autoComplete="email"
            disabled={busy}
          />

          <label className={styles.label}>パスワード</label>
          <input
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            type="password"
            autoComplete="current-password"
            disabled={busy}
          />

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.btnPrimary} type="button" onClick={submit} disabled={busy}>
            {busy ? 'ログイン中…' : 'ログイン'}
          </button>

          <div className={styles.note}>
            ログイン後は <strong>{returnTo}</strong> に戻ります
          </div>
        </section>
      </div>
    </main>
  );
}
