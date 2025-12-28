// app/auth/login/LoginClient.tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import { createClient } from '../../../lib/supabase/client';
import { consumeReturnTo, buildSignupUrl } from '../../../lib/askdesign/returnTo';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const returnTo = consumeReturnTo(searchParams, '/input');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(
          authError.message.includes('Supabase env missing')
            ? 'Supabase環境変数が未設定です。Vercel/ローカルに NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。'
            : authError.message
        );
        return;
      }

      router.push(returnTo);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ログインに失敗しました';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <h1 className={styles.title}>ログイン</h1>
        <p className={styles.subtitle}>メールアドレスとパスワードでログインします。</p>
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
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>

        <p className={styles.bottomText}>
          アカウントをお持ちでない方は{' '}
          <Link className={styles.link} href={buildSignupUrl(returnTo)}>
            新規登録
          </Link>
        </p>
      </form>
    </section>
  );
}
