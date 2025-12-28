'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthHeader from '../components/AuthHeader';
import styles from './page.module.css';
import MarkdownPreview from './MarkdownPreview';
import { createClient } from '../../lib/supabase/client';

type ResultPayload = {
  ok: boolean;
  target?: string;
  formatted_prompt?: string;
  generated_prompt?: string;
  explanation?: string;
  error?: { code?: string; message?: string };
};

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');

  const [title, setTitle] = useState<string>('生成結果');

  // 例：必要なら query から参照（あなたの実装に合わせて調整）
  const shareToken = searchParams.get('token') ?? '';
  const fromShare = Boolean(shareToken);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError('');

        // ✅ ここはあなたの既存実装があるなら置き換えてOK
        // shareToken がある場合は share 取得など
        if (fromShare) {
          const res = await fetch('/api/share/get', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ token: shareToken }),
          });

          const data = (await res.json()) as ResultPayload;

          if (!data?.ok) {
            setError(data?.error?.message ?? '共有データの取得に失敗しました。');
            return;
          }

          // プロジェクトの実データ構造に合わせて調整してOK
          // ここは「生成結果に表示する文字列」をセットするだけ
          setGeneratedPrompt((data as any).share?.generated_prompt ?? data.generated_prompt ?? '');
          setExplanation((data as any).share?.explanation ?? data.explanation ?? '');
          setTitle((data as any).share?.title ?? '共有結果');
          return;
        }

        // 通常表示（必要ならあなたのロジックに合わせて取得）
        // 例：URLパラメータから渡された内容を表示
        const gp = searchParams.get('generated_prompt') ?? '';
        const ex = searchParams.get('explanation') ?? '';
        if (gp) setGeneratedPrompt(gp);
        if (ex) setExplanation(ex);

        if (!gp && !ex) {
          // 何も無いときのフォールバック
          setGeneratedPrompt('');
          setExplanation('');
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : '不明なエラー';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [fromShare, shareToken, searchParams, supabase]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // noop
    }
  };

  return (
    <div className={styles.page}>
      <AuthHeader />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>生成されたプロンプトと説明を確認できます。</p>
          </div>

          {loading ? (
            <div className={styles.card}>
              <p className={styles.muted}>読み込み中...</p>
            </div>
          ) : error ? (
            <div className={styles.card}>
              <p className={styles.errorText}>{error}</p>
              <div className={styles.actions}>
                <button className={styles.button} onClick={() => router.push('/input')}>
                  入力画面へ戻る
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.grid}>
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>生成プロンプト</h2>
                  <div className={styles.actions}>
                    <button
                      className={styles.button}
                      onClick={() => copyToClipboard(generatedPrompt)}
                      disabled={!generatedPrompt}
                    >
                      コピー
                    </button>
                  </div>
                </div>

                <div className={styles.contentBox}>
                  {/* ✅ ここが今回の修正点：content → markdown */}
                  <MarkdownPreview markdown={generatedPrompt} />
                </div>

                {explanation && (
                  <div className={styles.subSection}>
                    <h3 className={styles.subTitle}>説明</h3>
                    <div className={styles.contentBox}>
                      <MarkdownPreview markdown={explanation} />
                    </div>
                  </div>
                )}
              </section>

              <aside className={styles.side}>
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>次にできること</h3>
                  <ul className={styles.list}>
                    <li>そのままDifyやChatGPTに貼り付けて試す</li>
                    <li>目的・制約を追加して再生成する</li>
                    <li>共有リンクを作ってチームに見せる</li>
                  </ul>

                  <div className={styles.actions}>
                    <button className={styles.buttonSecondary} onClick={() => router.push('/input')}>
                      もう一度つくる
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
