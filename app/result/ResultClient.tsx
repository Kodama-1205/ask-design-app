'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import MarkdownPreview from './MarkdownPreview';
import { saveResult } from '../../lib/history';

type ShareApiPayload = {
  ok: boolean;
  generated_prompt?: string;
  explanation?: string;
  error?: { code?: string; message?: string };
  share?: { title?: string; generated_prompt?: string; explanation?: string };
};

const LS_KEYS = {
  prompt: 'askdesign:generated_prompt',
  explanation: 'askdesign:explanation',
  inputs: 'askdesign:inputs',
};

export default function ResultClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [title, setTitle] = useState<string>('生成結果');

  const [saveMsg, setSaveMsg] = useState<string>('');
  const [saved, setSaved] = useState(false);

  const shareToken = searchParams.get('token') ?? '';
  const fromShare = Boolean(shareToken);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError('');

        // ① 共有（token）
        if (fromShare) {
          const res = await fetch('/api/share/get', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ token: shareToken }),
          });

          const data = (await res.json()) as ShareApiPayload;

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

        // ② URLクエリ互換
        const qp = searchParams.get('generated_prompt') ?? '';
        const qe = searchParams.get('explanation') ?? '';
        if (qp || qe) {
          setGeneratedPrompt(qp);
          setExplanation(qe);
          setTitle('生成結果');
          return;
        }

        // ③ localStorage fallback
        try {
          const p = localStorage.getItem(LS_KEYS.prompt) ?? '';
          const e = localStorage.getItem(LS_KEYS.explanation) ?? '';
          const raw = localStorage.getItem(LS_KEYS.inputs);
          const inp = raw ? JSON.parse(raw) : {};
          setGeneratedPrompt(p);
          setExplanation(e);
          setInputs(inp);
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
  }, [fromShare, shareToken, searchParams]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // noop
    }
  };

  const handleSave = () => {
    if (!generatedPrompt.trim()) return;
    saveResult({ generated_prompt: generatedPrompt, explanation, inputs });
    setSaved(true);
    setSaveMsg('保存しました。履歴から確認できます。');
  };

  const hasResult = Boolean(generatedPrompt.trim() || explanation.trim());

  return (
    <>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>生成されたプロンプトと説明を確認できます。</p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.buttonSecondary} onClick={() => router.push('/input')}>
            入力へ
          </button>
          <button className={styles.buttonSecondary} onClick={() => router.push('/history')}>
            履歴
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.card}>
          <p className={styles.muted}>読み込み中...</p>
        </div>
      ) : error ? (
        <div className={styles.card}>
          <p className={styles.errorText}>{error}</p>
          <div className={styles.actions}>
            <button className={styles.buttonSecondary} onClick={() => router.push('/input')}>
              入力画面へ戻る
            </button>
          </div>
        </div>
      ) : !hasResult ? (
        <div className={styles.card}>
          <p className={styles.muted}>まだ生成結果がありません。入力ページで生成してください。</p>
          <div className={styles.actions}>
            <button className={styles.buttonSecondary} onClick={() => router.push('/input')}>
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
                  className={styles.buttonPrimary}
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
              <div style={{ marginTop: 14 }}>
                <h3 className={styles.subTitle}>説明</h3>
                <div className={styles.contentBox}>
                  <MarkdownPreview content={explanation} />
                </div>
              </div>
            )}
          </section>

          <aside className={styles.side}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>この結果を保存</h3>
              <p className={styles.muted} style={{ marginTop: 8, fontSize: 13 }}>
                履歴にいつでも戻れるよう保存できます。
              </p>

              <div className={styles.actions} style={{ marginTop: 12 }}>
                <button
                  className={styles.buttonPrimary}
                  onClick={handleSave}
                  disabled={saved || !generatedPrompt.trim()}
                >
                  {saved ? '保存済み' : '保存する'}
                </button>
                <button className={styles.buttonSecondary} onClick={() => router.push('/history')}>
                  履歴を見る
                </button>
              </div>

              {saveMsg && (
                <p className={styles.muted} style={{ marginTop: 10, fontSize: 13 }}>
                  {saveMsg}
                </p>
              )}
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>次にできること</h3>
              <ul className={styles.list}>
                <li>そのままDifyやChatGPTに貼り付けて試す</li>
                <li>目的・制約を追加して再生成する</li>
                <li>共有リンクを作ってチームに見せる</li>
              </ul>

              <div className={styles.actions} style={{ marginTop: 10 }}>
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
