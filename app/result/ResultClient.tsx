'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import { createClient } from '../../lib/supabase/client';

type Row = {
  id: string;
  generated_prompt: string;
  explanation: string | null;
  created_at: string;
};

export default function ResultClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const id = searchParams.get('id');

  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr('');
      try {
        const { data: userRes } = await supabase.auth.getUser();
        if (!userRes?.user) {
          router.push('/auth/login');
          return;
        }

        let data: Row | null = null;

        if (id) {
          const res = await supabase
            .from('prompt_runs')
            .select('id, generated_prompt, explanation, created_at')
            .eq('id', id)
            .single();
          if (res.error) throw res.error;
          data = res.data as Row;
        } else {
          const res = await supabase
            .from('prompt_runs')
            .select('id, generated_prompt, explanation, created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (res.error) throw res.error;
          data = (res.data as Row) ?? null;
        }

        setRow(data);
      } catch (e: any) {
        setErr(e?.message ?? '読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [id, router, supabase]);

  const onCopy = async () => {
    if (!row?.generated_prompt) return;
    try {
      await navigator.clipboard.writeText(row.generated_prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  if (loading) return <p className={styles.muted}>読み込み中…</p>;

  if (err) {
    return (
      <section className={styles.card}>
        <p className={styles.error}>{err}</p>
        <button className={styles.secondary} onClick={() => router.push('/input')}>
          /input に戻る
        </button>
      </section>
    );
  }

  if (!row) {
    return (
      <section className={styles.card}>
        <p className={styles.muted}>結果がありません。/input から生成してください。</p>
        <button className={styles.secondary} onClick={() => router.push('/input')}>
          生成しに行く
        </button>
      </section>
    );
  }

  return (
    <>
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.h2}>生成プロンプト</h2>
          <button className={styles.copy} onClick={onCopy} disabled={!row.generated_prompt}>
            {copied ? 'コピーしました' : 'コピー'}
          </button>
        </div>
        <pre className={styles.pre}>{row.generated_prompt}</pre>
      </section>

      <section className={styles.card}>
        <h2 className={styles.h2}>説明</h2>
        <p className={styles.text}>{row.explanation || '（説明はありません）'}</p>
      </section>

      <section className={styles.card}>
        <h2 className={styles.h2}>次にできること</h2>
        <ul className={styles.list}>
          <li>そのままDifyやChatGPTに貼り付けて試す</li>
          <li>目的・制約を追加して再生成する</li>
          <li>共有リンク（/result?id=...）をチームに共有する</li>
        </ul>
        <button className={styles.secondary} onClick={() => router.push('/input')}>
          もう一度つくる
        </button>
      </section>
    </>
  );
}
