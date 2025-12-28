// app/auth/signup/page.tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import { createClient } from '../../../lib/supabase/client';
import { consumeReturnTo, buildLoginUrl } from '../../../lib/askdesign/returnTo';

export default function SignupPage() {
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
    if (password.trim().length < 6) {
      setError('パスワードは6文字以上にしてください');
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      // ✅ 登録成功 → 元ページへ（メール確認設定の場合でも、セッションが入ればOK）
      router.push(returnTo);
    } catch (e: any) {
      setError(e?.message ?? '新規登録に失敗しました');
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
            <Link className={styles.btnGhost} href={buildLoginUrl(returnTo)}>
              ログイン
            </Link>
          </div>
        </header>

        <section className={styles.card}>
          <div className={styles.toolbar}>
            <div className={styles.toolbarTitle}>新規登録</div>
            <div className={styles.toolbarActions}>
              <Link className={styles.btnGhost} href={buildLoginUrl(returnTo)}>
                ログインへ
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

          <label className={styles.label}>パスワード（6文字以上）</label>
          <input
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            type="password"
            autoComplete="new-password"
            disabled={busy}
          />

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.btnPrimary} type="button" onClick={submit} disabled={busy}>
            {busy ? '作成中…' : 'アカウント作成'}
          </button>

          <div className={styles.note}>
            登録後は <strong>{returnTo}</strong> に戻ります
          </div>
        </section>
      </div>
    </main>
  );
}
