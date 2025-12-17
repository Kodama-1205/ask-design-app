'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MarkdownResult from './MarkdownResult';

type ApiOk = {
  ok: true;
  dify: {
    data?: {
      outputs?: Record<string, any>;
    };
  };
};

type ApiNg = {
  ok: false;
  error: string;
  message?: string;
  hint?: string;
  bodyPreview?: string;
  requestUrl?: string;
  contentType?: string;
  status?: number;
};

type ApiResponse = ApiOk | ApiNg;

export default function ResultPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>(null);

  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr(null);
      setDebug(null);

      try {
        // /inputで保存したpayloadを読む
        const raw = sessionStorage.getItem('promptgen_payload');
        if (!raw) {
          router.replace('/input');
          return;
        }

        let payload: any;
        try {
          payload = JSON.parse(raw);
        } catch {
          sessionStorage.removeItem('promptgen_payload');
          router.replace('/input');
          return;
        }

        // Dify実行APIへ
        const res = await fetch('/api/dify/run-workflow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs: payload }),
        });

        const text = await res.text();

        let json: ApiResponse;
        try {
          json = JSON.parse(text);
        } catch {
          // APIがHTMLを返してきた等
          throw new Error(`APIがJSONを返しませんでした。先頭: ${text.slice(0, 140)}`);
        }

        if (!json.ok) {
          setDebug(json);
          throw new Error(json.hint || json.message || json.error || 'API Error');
        }

        // ここが重要：Difyのoutputsから取り出す
        const outputs = json.dify?.data?.outputs || {};

        // Dify側で「generated_prompt」にLLM.textを割り当て済みならここに入る
        const gp =
          outputs.generated_prompt ??
          outputs.generatedPrompts ??
          outputs.prompt ??
          outputs.text ??
          '';

        const exp = outputs.explanation ?? '';

        setGeneratedPrompt(String(gp));
        setExplanation(String(exp));
      } catch (e: any) {
        setErr(e?.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [router]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // 古い環境向けフォールバック
      const ta = document.createElement('textarea');
      ta.value = generatedPrompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.card}>生成中です…</div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>エラーが発生しました</div>
            <div style={{ color: '#b91c1c', fontWeight: 900 }}>{err}</div>

            {debug && (
              <>
                <div style={{ marginTop: 12, fontWeight: 900 }}>デバッグ情報</div>
                <pre style={styles.debugBox}>{JSON.stringify(debug, null, 2)}</pre>
              </>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <button style={styles.btn} onClick={() => router.push('/input')}>
                /input に戻る
              </button>
              <button style={styles.btnGhost} onClick={() => location.reload()}>
                再読み込み
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <div style={styles.h1}>生成結果</div>
            <div style={styles.sub}>そのまま貼って使える「完成プロンプト」です</div>
          </div>

          <div style={styles.actions}>
            <button style={styles.btn} onClick={onCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button style={styles.btnGhost} onClick={() => router.push('/input')}>
              Back
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionTitle}>generated_prompt</div>

          {/* ✅ Markdownとして綺麗に表示 */}
          <div style={styles.mdWrap}>
            <MarkdownResult content={generatedPrompt || '（空です）'} />
          </div>
        </div>

        {/* explanationは任意：Dify側で出しているなら表示 */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>explanation</div>
          <div style={styles.explanation}>{explanation || '（空です）'}</div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { background: '#fff', minHeight: '100vh', padding: 24 },
  container: { maxWidth: 980, margin: '0 auto', display: 'grid', gap: 16 },

  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  h1: { fontSize: 26, fontWeight: 900 },
  sub: { marginTop: 6, color: '#4b5563' },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },

  card: { border: '1px solid #e5e7eb', borderRadius: 14, padding: 16 },
  sectionTitle: { fontWeight: 900, marginBottom: 10 },

  mdWrap: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 14,
    overflowX: 'auto',
  },

  explanation: { lineHeight: 1.8, whiteSpace: 'pre-wrap' },

  btn: {
    background: '#16a34a',
    color: 'white',
    border: 'none',
    padding: '10px 12px',
    borderRadius: 12,
    fontWeight: 900,
    cursor: 'pointer',
  },
  btnGhost: {
    background: 'transparent',
    border: '1px solid #d1d5db',
    padding: '10px 12px',
    borderRadius: 12,
    fontWeight: 900,
    cursor: 'pointer',
  },

  debugBox: {
    background: '#111827',
    color: '#e5e7eb',
    padding: 12,
    borderRadius: 10,
    overflowX: 'auto',
    marginTop: 8,
  },
};
