// app/result/ResultClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import MarkdownPreview from './MarkdownPreview';
import { createClient } from '../../lib/supabase/client';

type ResultPayload = {
  ok: boolean;
  generated_prompt?: string;
  explanation?: string;
  error?: { code?: string; message?: string };
  share?: {
    title?: string;
    generated_prompt?: string;
    explanation?: string;
  };
};

const LS_KEYS = {
  prompt: 'askdesign:generated_prompt',
  explanation: 'askdesign:explanation',
};

export default function ResultClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [title, setTitle] = useState<string>('生成結果');

  const shareToken = searchParams.get('token') ?? '';
  const fromShare = Boolean(shareToken);

  const runId = searchParams.get('id') ?? '';
  const hasRunId = Boolean(runId);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError('');

        // ① 共有（token）優先
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

          const gp = data.share?.generated_prompt ?? data.generated_prompt ?? '';
          const ex = data.share?.explanation ?? data.explanation ?? '';
          setGeneratedPrompt(gp);
          setExplanation(ex);
          setTitle(data.share?.title ?? '共有結果');
          return;
        }

        // ② id がある場合：DBから取得（スマホ対応）
        if (hasRunId) {
          const { data, error } = await supabase
            .from('prompt_runs')
            .select('generated_prompt, explanation, created_at')
            .eq('id', runId)
            .single();

          if (error || !data) {
            setError('結果の取得に失敗しました（IDが存在しない / 権限なし / DBエラー）');
            return;
          }

          setGeneratedPrompt(data.generated_prompt ?? '');
          setExplanation(data.explanation ?? '');
          setTitle('生成結果');
          return;
        }

        // ③ URLクエリで渡された場合（互換）
        const qp = searchParams.get('generated_prompt') ?? '';
        const qe = searchParams.get('explanation') ?? '';
        if (qp || qe) {
          setGeneratedPrompt(qp);
          setExplanation(qe);
          setTitle('生成結果');
          return;
        }

        // ④ ✅ localStorage fallback（いまの /input の動きに対応）
        try {
          const p = localStorage.getItem(LS_KEYS.prompt) ?? '';
          const e = localStorage.getItem(LS_KEYS.explanation) ?? '';
          setGeneratedPrompt(p);
          setExplanation(e);
          setTitle('生成結果');
        } catch {
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
  }, [fromShare, shareToken, hasRunId, runId, searchParams, supabase]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // noop
    }
  };

  const hasResult = Boolean(generatedPrompt.trim() || explanation.trim());

  return (
    <>
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
      ) : !hasResult ? (
        <div className={styles.card}>
          <p className={styles.muted}>まだ生成結果がありません。/input で生成してください。</p>
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
              <MarkdownPreview content={generatedPrompt} />
            </div>

            {explanation && (
              <div className={styles.subSection}>
                <h3 className={styles.subTitle}>説明</h3>
                <div className={styles.contentBox}>
                  <MarkdownPreview content={explanation} />
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
    </>
  );
}
