'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import { createClient } from '../../lib/supabase/client';

import {
  SKILL_LEVEL_OPTIONS,
  TOOL_OPTIONS,
  type SkillLevel,
  splitTools,
  joinTools,
} from '../../lib/askdesign/options';

type InputsPayload = {
  goal?: string;
  context?: string;
  skill_level?: SkillLevel | string;
  tools?: string;
  [k: string]: any;
};

type RunWorkflowResponse = {
  generated_prompt: string;
  explanation: string;
};

const STORAGE = {
  onboardingDone: 'askdesign:onboarding_done_v1',
};

export default function InputClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const templateId = sp.get('templateId');

  const supabase = useMemo(() => createClient(), []);

  const [goal, setGoal] = useState('');
  const [context, setContext] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner');

  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [customTool, setCustomTool] = useState('');

  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [error, setError] = useState('');

  const abortRef = useRef<AbortController | null>(null);

  const lastPayloadRef = useRef<{
    goal: string;
    context: string;
    skill_level: SkillLevel;
    tools: string;
  } | null>(null);

  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const isBusy = loadingTemplate || loadingGenerate;

  const toolsText = useMemo(() => {
    return joinTools(selectedTools, customTool);
  }, [selectedTools, customTool]);

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) => (prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]));
  };

  const hydrateToolsFromString = (toolsRaw: string) => {
    const { known, unknown } = splitTools(toolsRaw ?? '');
    setSelectedTools(known);
    setCustomTool(unknown.join(', '));
  };

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE.onboardingDone);
      if (!done) setOnboardingOpen(true);
    } catch {
      // ignore
    }
  }, []);

  const markOnboardingDone = () => {
    try {
      localStorage.setItem(STORAGE.onboardingDone, '1');
    } catch {
      // ignore
    }
  };

  // テンプレ自動読み込み
  useEffect(() => {
    const run = async () => {
      setError('');
      if (!templateId) return;

      setLoadingTemplate(true);

      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes?.user) {
        setLoadingTemplate(false);
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('templates')
        .select('id,title,content,inputs')
        .eq('id', templateId)
        .single();

      if (error || !data) {
        setLoadingTemplate(false);
        setError('テンプレの読み込みに失敗しました（存在しない/権限なし/DBエラー）');
        return;
      }

      const inputs = (data.inputs ?? {}) as InputsPayload;

      setGoal(inputs.goal ?? '');
      setContext(inputs.context ?? '');

      const lv = inputs.skill_level as SkillLevel;
      setSkillLevel(lv === 'intermediate' || lv === 'advanced' ? lv : 'beginner');

      hydrateToolsFromString(inputs.tools ?? '');

      try {
        localStorage.setItem(
          'askdesign:inputs',
          JSON.stringify({
            ...(inputs ?? {}),
            goal: inputs.goal ?? '',
            context: inputs.context ?? '',
            skill_level: lv === 'intermediate' || lv === 'advanced' ? lv : 'beginner',
            tools: inputs.tools ?? '',
            templateId,
          })
        );
      } catch {
        // ignore
      }

      setLoadingTemplate(false);
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  const cancelGenerate = () => {
    abortRef.current?.abort();
  };

  // ✅ 生成 → localStorage 保存 → ✅ DB保存 → /result?id=...
  const handleGenerate = async (payloadOverride?: {
    goal: string;
    context: string;
    skill_level: SkillLevel;
    tools: string;
  }) => {
    setError('');

    const payload = payloadOverride ?? {
      goal,
      context,
      skill_level: skillLevel,
      tools: toolsText,
    };

    if (!payload.goal.trim()) {
      setError('目的（Goal）は必須です');
      return;
    }

    setLoadingGenerate(true);

    const controller = new AbortController();
    abortRef.current = controller;

    lastPayloadRef.current = payload;

    try {
      const res = await fetch('/api/dify/run-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as
        | RunWorkflowResponse
        | { error?: string }
        | null;

      if (!res.ok) {
        const msg = (data as any)?.error ? String((data as any).error) : `生成APIエラー: ${res.status}`;
        throw new Error(msg);
      }

      if (!data || typeof (data as any).generated_prompt !== 'string') {
        throw new Error('APIレスポンスが不正です（generated_prompt がありません）');
      }

      const generated_prompt = String((data as any).generated_prompt || '');
      const explanation = String((data as any).explanation || '');

      if (!generated_prompt.trim()) {
        throw new Error('生成結果が空です（Difyの出力を確認してください）');
      }

      // (1) localStorage（同端末で即表示）
      try {
        localStorage.setItem('askdesign:generated_prompt', generated_prompt);
        localStorage.setItem('askdesign:explanation', explanation);

        localStorage.setItem(
          'askdesign:inputs',
          JSON.stringify({
            goal: payload.goal,
            context: payload.context,
            skill_level: payload.skill_level,
            tools: payload.tools,
            loaded_template_id: templateId ?? null,
          })
        );
      } catch {
        // ignore
      }

      // (2) ✅ DB保存（スマホ/別端末でも同じ結果）
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: inserted, error: insertError } = await supabase
        .from('prompt_runs')
        .insert({
          user_id: user.id,
          generated_prompt,
          explanation,
        })
        .select('id')
        .single();

      if (insertError || !inserted?.id) {
        // DB保存できなくても、最低限 /result は表示（同端末）
        router.push('/result');
        return;
      }

      // (3) ✅ id付きで遷移（これが最終形）
      router.push(`/result?id=${inserted.id}`);
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        setError('生成をキャンセルしました（内容は保持されています）');
      } else {
        setError(e?.message ?? '生成に失敗しました（再試行できます）');
      }
    } finally {
      setLoadingGenerate(false);
      abortRef.current = null;
    }
  };

  const retry = () => {
    const last = lastPayloadRef.current;
    if (!last) return handleGenerate();
    handleGenerate(last);
  };

  const skillLabel = useMemo(() => {
    return SKILL_LEVEL_OPTIONS.find((x) => x.value === skillLevel)?.label ?? '初心者';
  }, [skillLevel]);

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Ask Design</h1>
          <p className={styles.sub}>Prompt Generator</p>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.btnGhost}
            type="button"
            onClick={() => setOnboardingOpen(true)}
            title="使い方（1分）"
          >
            ガイド
          </button>
          <button className={styles.btnGhost} type="button" onClick={() => router.push('/templates')}>
            /templates
          </button>
          <button className={styles.btnGhost} type="button" onClick={() => router.push('/result')}>
            /result
          </button>
        </div>
      </header>

      <section className={styles.card}>
        {templateId && (
          <div className={styles.banner}>
            {loadingTemplate ? (
              <span>テンプレ読込中…</span>
            ) : (
              <span>
                テンプレを読み込みました（ID: <strong>{templateId}</strong>）
              </span>
            )}
          </div>
        )}

        <label className={styles.label}>目的（Goal） *</label>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className={styles.textarea}
          placeholder="例：ExcelとSlackで週次レポート作成を自動化したい"
          disabled={isBusy}
        />

        <label className={styles.label}>前提・背景（Context）</label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className={styles.textarea}
          placeholder="例：データはExcel、報告はSlack。初心者でも運用できる形にしたい"
          disabled={isBusy}
        />

        <label className={styles.label}>
          スキルレベル <span style={{ opacity: 0.75, fontWeight: 800 }}>（現在：{skillLabel}）</span>
        </label>
        <div className={styles.row}>
          {SKILL_LEVEL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSkillLevel(opt.value)}
              className={skillLevel === opt.value ? styles.btnActive : styles.btnGhost}
              disabled={isBusy}
              title={opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <label className={styles.label}>使用ツール（選択）</label>
        <div className={styles.row}>
          {(TOOL_OPTIONS as readonly string[]).map((tool) => (
            <button
              key={tool}
              type="button"
              onClick={() => toggleTool(tool)}
              className={selectedTools.includes(tool) ? styles.btnActive : styles.btnGhost}
              disabled={isBusy}
            >
              {tool}
            </button>
          ))}
        </div>

        <label className={styles.label}>その他ツール（自由入力・カンマ区切り）</label>
        <input
          value={customTool}
          onChange={(e) => setCustomTool(e.target.value)}
          className={styles.input}
          placeholder="例：Google Sheets, Zapier"
          disabled={isBusy}
        />

        <div className={styles.previewLine}>
          <span className={styles.previewLabel}>現在の tools:</span>
          <span className={styles.previewValue}>{toolsText || '（未指定）'}</span>
        </div>

        {error && (
          <div className={styles.error}>
            {error}
            {!loadingGenerate && (
              <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className={styles.btnGhost} type="button" onClick={retry}>
                  再試行
                </button>
                <button className={styles.btnGhost} type="button" onClick={() => setError('')}>
                  閉じる
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => handleGenerate()} disabled={isBusy} className={styles.btnPrimary}>
            {loadingGenerate ? '生成中…' : '生成する'}
          </button>

          {loadingGenerate && (
            <button className={styles.btnGhost} type="button" onClick={cancelGenerate}>
              キャンセル
            </button>
          )}
        </div>

        {loadingGenerate && (
          <div className={styles.banner} style={{ marginTop: 12 }}>
            生成中です。止まっているように見える場合は「キャンセル」→「再試行」できます。
          </div>
        )}
      </section>

      <Modal
        open={onboardingOpen}
        title="Ask Design の使い方（1分）"
        description="Goal と Context を入れて「完成プロンプト」を生成 → 良い結果はテンプレ保存して育てていくのがコツです。"
        cancelText="今は閉じる"
        confirmText="このガイドを表示しない"
        secondaryText="OK（閉じる）"
        onCancel={() => setOnboardingOpen(false)}
        onConfirm={() => {
          markOnboardingDone();
          setOnboardingOpen(false);
        }}
        onSecondary={() => setOnboardingOpen(false)}
      >
        <div style={{ display: 'grid', gap: 10 }}>
          <Step
            no="1"
            title="Goal を1行で"
            desc="まずは目的だけ決める（例：週次レポート自動化、提案書作成、要件整理など）"
          />
          <Step
            no="2"
            title="Context は“前提”を箇条書きで"
            desc="データ形式 / 制約 / 出力先 / 何が困っているか、を書くと精度が上がります"
          />
          <Step
            no="3"
            title="スキルとツールを選ぶ"
            desc="初心者なら手順が丁寧に、上級なら実務向けに。ツール指定で指示が具体化します"
          />
          <Step no="4" title="生成 → /result で確認" desc="スマホでも同じ結果が見られるように保存されます" />
          <div style={hintStyle}>※右上の「ガイド」からいつでも再表示できます</div>
        </div>
      </Modal>
    </>
  );
}

function Step({ no, title, desc }: { no: string; title: string; desc: string }) {
  return (
    <div style={stepStyle.wrap}>
      <div style={stepStyle.no}>{no}</div>
      <div style={{ display: 'grid', gap: 4 }}>
        <div style={stepStyle.title}>{title}</div>
        <div style={stepStyle.desc}>{desc}</div>
      </div>
    </div>
  );
}

function Modal({
  open,
  title,
  description,
  cancelText,
  confirmText,
  secondaryText,
  onCancel,
  onConfirm,
  onSecondary,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  cancelText: string;
  confirmText: string;
  secondaryText?: string;
  onCancel: () => void;
  onConfirm: () => void;
  onSecondary?: () => void;
  children?: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div style={modal.overlay} role="dialog" aria-modal="true">
      <div style={modal.card}>
        <div style={modal.header}>
          <div style={modal.title}>{title}</div>
          <button onClick={onCancel} style={modal.xBtn} aria-label="閉じる">
            ✕
          </button>
        </div>

        {description && <div style={modal.desc}>{description}</div>}

        {children && <div style={{ marginTop: 12 }}>{children}</div>}

        <div style={modal.actions}>
          <button onClick={onCancel} style={modal.cancel}>
            {cancelText}
          </button>

          {secondaryText && onSecondary && (
            <button onClick={onSecondary} style={modal.secondary}>
              {secondaryText}
            </button>
          )}

          <button onClick={onConfirm} style={modal.confirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

const modal: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1200,
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    background: '#fff',
    borderRadius: 18,
    padding: 16,
    boxShadow: '0 20px 60px rgba(0,0,0,0.20)',
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { fontSize: 16, fontWeight: 900, color: '#0f172a' },
  xBtn: {
    border: '1px solid #e2e8f0',
    background: '#fff',
    borderRadius: 12,
    padding: '6px 10px',
    cursor: 'pointer',
    fontWeight: 900,
  },
  desc: { marginTop: 10, fontSize: 13, color: '#475569', lineHeight: 1.65 },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  cancel: {
    border: '1px solid #d1d5db',
    background: '#fff',
    borderRadius: 12,
    padding: '10px 12px',
    fontWeight: 900,
    cursor: 'pointer',
  },
  secondary: {
    border: '1px solid rgba(34,197,94,.35)',
    background: 'rgba(34,197,94,.08)',
    borderRadius: 12,
    padding: '10px 12px',
    fontWeight: 900,
    cursor: 'pointer',
    color: '#065f46',
  },
  confirm: {
    border: 'none',
    color: '#fff',
    background: '#16a34a',
    borderRadius: 12,
    padding: '10px 12px',
    fontWeight: 900,
    cursor: 'pointer',
  },
};

const stepStyle: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    padding: '10px 12px',
    borderRadius: 14,
    border: '1px solid rgba(148,163,184,.28)',
    background: 'rgba(15,23,42,.02)',
  },
  no: {
    minWidth: 28,
    height: 28,
    borderRadius: 999,
    display: 'grid',
    placeItems: 'center',
    fontWeight: 900,
    color: '#065f46',
    border: '1px solid rgba(34,197,94,.35)',
    background: 'rgba(34,197,94,.08)',
  },
  title: { fontSize: 13, fontWeight: 900, color: '#0f172a' },
  desc: { fontSize: 12, fontWeight: 700, color: '#475569', lineHeight: 1.6 },
};

const hintStyle: React.CSSProperties = {
  marginTop: 2,
  fontSize: 12,
  color: '#64748b',
  lineHeight: 1.6,
};
