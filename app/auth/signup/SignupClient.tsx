// app/auth/signup/SignupClient.tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import { createClient } from '../../../lib/supabase/client';
import { consumeReturnTo, buildLoginUrl } from '../../../lib/askdesign/returnTo';

export default function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const returnTo = consumeReturnTo(searchParams, '/input');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // メール確認がONの場合もあるので、完了表示にして誘導
      setDone(true);

      // すぐ遷移させたい場合はコメント解除（好みで）
      // router.push(returnTo);
      // router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '登録に失敗しました';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h1 className={styles.title}>登録しました</h1>
          <p className={styles.subtitle}>
            メール確認が必要な設定の場合、届いたメールのリンクをクリックしてください。
          </p>
        </div>

        <div className={styles.actions}>
          <Link className={styles.button} href={buildLoginUrl(returnTo)}>
            ログインへ
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <h1 className={styles.title}>新規登録</h1>
        <p className={styles.subtitle}>メールアドレスとパスワードでアカウントを作成します。</p>
      </div>

      <form className={styles.form} onSubmit={onSubmit}>
        <label className={styles.label}>
          メールアドレス
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className={styles.label}>
          パスワード
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
          />
        </label>

        {error && <p className={styles.errorText}>{error}</p>}

        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? '登録中...' : '登録する'}
        </button>

        <p className={styles.bottomText}>
          すでにアカウントをお持ちの方は{' '}
          <Link className={styles.link} href={buildLoginUrl(returnTo)}>
            ログイン
          </Link>
        </p>
      </form>
    </section>
  );
}
