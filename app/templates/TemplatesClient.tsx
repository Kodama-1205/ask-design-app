// app/templates/TemplatesClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { createClient } from '../../lib/supabase/client';

import {
  SKILL_LEVEL_OPTIONS,
  TOOL_OPTIONS,
  type SkillLevel,
  splitTools,
} from '../../lib/askdesign/options';

import MarkdownPreview from '../result/MarkdownPreview';

/* ======================
   型定義
====================== */
type TemplateRow = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  inputs: any;
  pinned: boolean;
  archived?: boolean;
  created_at: string;
};

type ToastKind = 'success' | 'error' | 'info';
type SortKey = 'newest' | 'oldest' | 'title';

/* ======================
   ページ本体（Client）
====================== */
export default function TemplatesClient() {
  const router = useRouter();
  const supabase = createClient();

  const [items, setItems] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [toolFilter, setToolFilter] = useState<string | null>(null);

  /* ---------- Toast ---------- */
  const [toast, setToast] = useState<{ open: boolean; kind: ToastKind; message: string }>({
    open: false,
    kind: 'info',
    message: '',
  });

  const showToast = (kind: ToastKind, message: string) => {
    setToast({ open: true, kind, message });
    window.setTimeout(() => setToast({ open: false, kind: 'info', message: '' }), 2200);
  };

  /* ---------- 全文モーダル ---------- */
  const [viewOpen, setViewOpen] = useState(false);
  const [viewTpl, setViewTpl] = useState<TemplateRow | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');

  const openView = (tpl: TemplateRow) => {
    setViewTpl(tpl);
    setViewMode('preview');
    setViewOpen(true);
  };

  const closeView = () => {
    setViewOpen(false);
    setViewTpl(null);
  };

  /* ---------- fetch ---------- */
  const fetchTemplates = async () => {
    setLoading(true);
    setError('');

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setItems((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- 条件コピー ---------- */
  const copyConditions = async (tpl: TemplateRow) => {
    const inputs = (tpl.inputs ?? {}) as { skill_level?: SkillLevel | string; tools?: string };

    const skillValue =
      inputs.skill_level === 'intermediate' || inputs.skill_level === 'advanced'
        ? inputs.skill_level
        : 'beginner';

    const skillLabel = SKILL_LEVEL_OPTIONS.find((x) => x.value === skillValue)?.label ?? '初心者';

    const toolsRaw = typeof inputs.tools === 'string' ? inputs.tools : '';
    const { known, unknown } = splitTools(toolsRaw);
    const tools = [...known, ...unknown];

    const lines: string[] = [];
    if (skillLabel) lines.push(`スキル: ${skillLabel}`);
    if (tools.length > 0) lines.push(`使用ツール: ${tools.join(', ')}`);

    if (lines.length === 0) {
      showToast('info', 'コピーできる条件がありません');
      return;
    }

    await navigator.clipboard.writeText(lines.join('\n'));
    showToast('success', '条件をコピーしました');
  };

  /* ---------- フィルタ ---------- */
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    const list = items.filter((tpl) => {
      if (tpl.archived) return false;

      const inputs = (tpl.inputs ?? {}) as { tools?: string };
      const toolsRaw = inputs.tools ?? '';
      const { known, unknown } = splitTools(toolsRaw);
      const allTools = [...known, ...unknown];

      if (toolFilter && !allTools.includes(toolFilter)) return false;

      if (!query) return true;

      return tpl.title.toLowerCase().includes(query) || tpl.content.toLowerCase().includes(query);
    });

    const cmp = (a: TemplateRow, b: TemplateRow) => {
      if (sortKey === 'title') return a.title.localeCompare(b.title, 'ja');
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sortKey === 'oldest' ? ta - tb : tb - ta;
    };

    return {
      pinned: list.filter((x) => x.pinned).sort(cmp),
      normal: list.filter((x) => !x.pinned).sort(cmp),
      total: list.length,
    };
  }, [items, q, sortKey, toolFilter]);

  /* ======================
     Render
====================== */
  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Ask Design</h1>
          <p className={styles.sub}>Prompt Generator</p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.btnGhost} onClick={() => router.push('/input')}>
            /input
          </button>
          <button className={styles.btnGhost} onClick={() => router.push('/result')}>
            /result
          </button>
        </div>
      </header>

      <section className={styles.card}>
        {loading ? (
          <div className={styles.muted}>読み込み中...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : items.length === 0 ? (
          <div className={styles.muted}>
            保存済みテンプレはありません。/result で生成後に保存できます。
          </div>
        ) : (
          <div className={styles.grid}>
            {[...filtered.pinned, ...filtered.normal].map((tpl) => (
              <div key={tpl.id} className={styles.item}>
                <div className={styles.itemHeader}>
                  <div className={styles.itemTitle}>{tpl.title}</div>
                </div>

                <div className={styles.itemPreview}>{tpl.content}</div>

                <div className={styles.itemActions}>
                  <button className={styles.btnGhost} onClick={() => openView(tpl)}>
                    全文
                  </button>
                  <button className={styles.btnGhost} onClick={() => copyConditions(tpl)}>
                    条件コピー
                  </button>
                  <button
                    className={styles.btnPrimary}
                    onClick={() => {
                      localStorage.setItem('askdesign:inputs', JSON.stringify(tpl.inputs ?? {}));
                      router.push('/input');
                    }}
                  >
                    /inputに読み込む
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {viewOpen && viewTpl && (
        <div style={modal.overlay} role="dialog" aria-modal="true">
          <div style={modal.card}>
            <div style={modal.header}>
              <div style={modal.title}>{viewTpl.title}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={viewMode === 'preview' ? modal.tabActive : modal.tab}
                  onClick={() => setViewMode('preview')}
                >
                  Preview
                </button>
                <button
                  style={viewMode === 'raw' ? modal.tabActive : modal.tab}
                  onClick={() => setViewMode('raw')}
                >
                  Raw
                </button>
                <button onClick={closeView} style={modal.xBtn} aria-label="閉じる">
                  ✕
                </button>
              </div>
            </div>
            <div style={modal.body}>
              {viewMode === 'preview' ? (
                <MarkdownPreview content={viewTpl.content} />
              ) : (
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{viewTpl.content}</pre>
              )}
            </div>
          </div>
        </div>
      )}

      {toast.open && (
        <div style={{ position: 'fixed', bottom: 16, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: 12, background: '#fff', borderRadius: 12 }}>
            {toast.message}
          </div>
        </div>
      )}
    </>
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
    maxWidth: 640,
    background: '#fff',
    borderRadius: 18,
    padding: 16,
    boxShadow: '0 20px 60px rgba(0,0,0,0.20)',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  title: { fontSize: 15, fontWeight: 900, color: '#0f172a' },
  body: { overflowY: 'auto', flex: 1 },
  xBtn: {
    border: '1px solid #e2e8f0',
    background: '#fff',
    borderRadius: 12,
    padding: '6px 10px',
    cursor: 'pointer',
    fontWeight: 900,
  },
  tab: {
    border: '1px solid #e2e8f0',
    background: '#fff',
    borderRadius: 10,
    padding: '5px 10px',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
  },
  tabActive: {
    border: '1px solid #16a34a',
    background: 'rgba(34,197,94,.1)',
    borderRadius: 10,
    padding: '5px 10px',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    color: '#065f46',
  },
};
