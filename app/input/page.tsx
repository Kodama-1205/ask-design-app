'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import AuthHeader from '../components/AuthHeader';
import { createClient } from '../../lib/supabase/client';

type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

const TOOL_OPTIONS = ['ChatGPT', 'Gemini', 'Claude', 'Excel', 'Slack', 'Notion'] as const;

export default function InputPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [goal, setGoal] = useState('');
  const [context, setContext] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner');
  const [tools, setTools] = useState<string[]>(['ChatGPT']);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleTool = (t: string) => {
    setTools((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const onSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      // 0) ログイン確認（未ログインならログインへ）
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userRes.user;
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // 1) 生成（サーバーAPI経由）
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          context,
          skill_level: skillLevel,
          tools: tools.join(','),
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t);
      }

      const { generated_prompt, explanation } = await res.json();

      // 2) 保存（スマホでも見れるようにDBに保存）
      const { data: saved, error: saveErr } = await supabase
        .from('prompt_runs')
        .insert({
          user_id: user.id,
          generated_prompt,
          explanation,
          input: { goal, context, skill_level: skillLevel, tools },
        })
        .select('id')
        .single();

      if (saveErr) throw saveErr;

      // 3) /result?id=... へ
      router.push(`/result?id=${saved.id}`);
    } catch (e: any) {
      setError(e?.message ?? 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <AuthHeader />
      <main className={styles.main}>
        <h1 className={styles.title}>入力</h1>

        <section className={styles.card}>
          <label className={styles.label}>Goal（目的）</label>
          <input
            className={styles.input}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="例：週次レポート自動化、提案書作成、要件整理"
          />

          <label className={styles.label}>Context（前提・状況）</label>
          <textarea
            className={styles.textarea}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="例：データ形式、制約、出力先、困っている点など"
            rows={6}
          />

          <label className={styles.label}>スキル</label>
          <div className={styles.pills}>
            {(['beginner', 'intermediate', 'advanced'] as SkillLevel[]).map((lv) => (
              <button
                key={lv}
                type="button"
                className={`${styles.pill} ${skillLevel === lv ? styles.pillActive : ''}`}
                onClick={() => setSkillLevel(lv)}
              >
                {lv}
              </button>
            ))}
          </div>

          <label className={styles.label}>使うツール</label>
          <div className={styles.pills}>
            {TOOL_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                className={`${styles.pill} ${tools.includes(t) ? styles.pillActive : ''}`}
                onClick={() => toggleTool(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.primary} type="button" onClick={onSubmit} disabled={loading || !goal.trim()}>
            {loading ? '生成中…' : '生成する'}
          </button>
        </section>
      </main>
    </div>
  );
}
