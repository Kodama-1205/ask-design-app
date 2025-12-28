// app/result/page.tsx（完成版：⑱ 空result時の自動復帰UX）
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthHeader from '../components/AuthHeader';
import styles from './page.module.css';
import MarkdownPreview from './MarkdownPreview';

const STORAGE = {
  prompt: 'askdesign:generated_prompt',
  explanation: 'askdesign:explanation',
  inputs: 'askdesign:inputs',
};

function hasAnyInput(raw: any) {
  if (!raw) return false;
  return Boolean(
    (raw.goal && String(raw.goal).trim()) ||
    (raw.context && String(raw.context).trim()) ||
    (raw.tools && String(raw.tools).trim())
  );
}

export default function ResultPage() {
  const router = useRouter();

  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [explanation, setExplanation] = useState('');
  const [hasInputs, setHasInputs] = useState(false);

  useEffect(() => {
    try {
      const p = localStorage.getItem(STORAGE.prompt) ?? '';
      const e = localStorage.getItem(STORAGE.explanation) ?? '';
      const iRaw = localStorage.getItem(STORAGE.inputs);
      const i = iRaw ? JSON.parse(iRaw) : null;

      setGeneratedPrompt(p);
      setExplanation(e);
      setHasInputs(hasAnyInput(i));
    } catch {
      // ignore
    }
  }, []);

  const hasResult = Boolean(generatedPrompt.trim());

  const goBackToInput = () => {
    router.push('/input');
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <AuthHeader />

        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Ask Design</h1>
            <p className={styles.sub}>Prompt Generator</p>
          </div>

          <div className={styles.headerActions}>
            <button className={styles.btnGhost} type="button" onClick={() => router.push('/input')}>
              /input
            </button>
            <button className={styles.btnGhost} type="button" onClick={() => router.push('/templates')}>
              /templates
            </button>
          </div>
        </header>

        <section className={styles.card}>
          {/* ✅ ⑱：結果が無い場合の分岐UX */}
          {!hasResult && (
            <div className={styles.banner}>
              {hasInputs ? (
                <>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>
                    生成結果が見つかりません
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    直前の入力内容は残っています。
                    <br />
                    /input に戻って続きを作成できます。
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={goBackToInput}
                    >
                      /input に戻る
                    </button>

                    <Link href="/" className={styles.btnGhost}>
                      TOPへ戻る
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>
                    まだ生成されていません
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    /input からプロンプトを生成してください。
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <Link href="/input" className={styles.btnPrimary}>
                      /input へ
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ✅ 通常表示 */}
          {hasResult && (
            <>
              <div className={styles.toolbar}>
                <button className={styles.btnActive} type="button">
                  完成プロンプト
                </button>
              </div>

              <div className={styles.contentBox}>
                <MarkdownPreview content={generatedPrompt} />
              </div>

              {explanation && (
                <div style={{ marginTop: 14 }}>
                  <div className={styles.sub} style={{ marginBottom: 6 }}>
                    補足説明
                  </div>
                  <MarkdownPreview content={explanation} />
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
