'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import MarkdownPreview from './MarkdownPreview';
import { createClient } from '../../lib/supabase/client';

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
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [title, setTitle] = useState<string>('生成結果');

  // テンプレ保存UI
  const [tplTitle, setTplTitle] = useState('');
  const [savingTpl, setSavingTpl] = useState(false);
  const [tplMsg, setTplMsg] = useState<string>('');

  const shareToken = searchParams.get('token') ?? '';
  const fromShare = Boolean(shareToken);

  const runId = searchParams.get('id') ?? '';
  const hasRunId = Boolean(runId);

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

        // ② ✅ id（DB）優先
        if (hasRunId) {
          const { data, error } = await supabase
            .from('prompt_runs')
            .select('generated_prompt, explanation')
            .eq('id', runId)
            .single();

          if (error || !data) {
            setError('結果の取得に失敗しました（IDが存在しない/権限なし/DBエラー）');
            return;
          }

          setGeneratedPrompt(data.generated_prompt ?? '');
          setExplanation(data.explanation ?? '');
          setTitle('生成結果');
          return;
        }

        // ③ URLクエリ互換
        const qp = searchParams.get('generated_prompt') ?? '';
        const qe = searchParams.get('explanation') ?? '';
        if (qp || qe) {
          setGeneratedPrompt(qp);
          setExplanation(qe);
          setTitle('生成結果');
          return;
        }

        // ④ localStorage fallback
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

  // ✅ テンプレ保存（templates テーブルへ）
  const saveAsTemplate = async () => {
    setTplMsg('');
    if (!generatedPrompt.trim()) {
      setTplMsg('生成プロンプトが空なので保存できません。');
      return;
    }
    if (!tplTitle.trim()) {
      setTplMsg('テンプレ名を入力してください。');
      return;
    }

    setSavingTpl(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // 入力情報（あるなら）も一緒に保存
      let inputs: any = null;
      try {
        const raw = localStorage.getItem(LS_KEYS.inputs);
        inputs = raw ? JSON.parse(raw) : null;
      } catch {
        inputs = null;
      }

      // content は既存設計に合わせて「生成物」を入れる（あなたの templates 読み込みに支障なし）
      const content = generatedPrompt;

      const { error } = await supabase.from('templates').insert({
        title: tplTitle.trim(),
        content,
        inputs: inputs ?? {},
      });

      if (error) throw error;

      setTplMsg('テンプレとして保存しました。/templates で確認できます。');
      setTplTitle('');
    } catch (e: any) {
      setTplMsg(e?.message ?? 'テンプレ保存に失敗しました。');
    } finally {
      setSavingTpl(false);
    }
  };

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
          <button className={styles.buttonSecondary} onClick={() => router.push('/templates')}>
            テンプレ
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
          <p className={styles.muted}>まだ生成結果がありません。/input で生成してください。</p>
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
              <h3 className={styles.cardTitle}>テンプレに保存</h3>

              <div className={styles.field}>
                <div className={styles.label}>テンプレ名</div>
                <input
                  className={styles.input}
                  value={tplTitle}
                  onChange={(e) => setTplTitle(e.target.value)}
                  placeholder="例：週次レポート自動化（Slack+Excel）"
                  disabled={savingTpl}
                />
              </div>

              <div className={styles.actions} style={{ marginTop: 10 }}>
                <button className={styles.buttonPrimary} onClick={saveAsTemplate} disabled={savingTpl}>
                  {savingTpl ? '保存中…' : '保存する'}
                </button>
                <button className={styles.buttonSecondary} onClick={() => router.push('/templates')}>
                  テンプレ一覧へ
                </button>
              </div>

              {tplMsg && <p className={tplMsg.includes('失敗') ? styles.errorText : styles.muted} style={{ marginTop: 10 }}>{tplMsg}</p>}
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
