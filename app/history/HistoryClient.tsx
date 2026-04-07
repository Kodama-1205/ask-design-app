'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { getHistory, deleteResult, clearHistory, type HistoryItem } from '../../lib/history';
import MarkdownPreview from '../result/MarkdownPreview';

export default function HistoryClient() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [viewItem, setViewItem] = useState<HistoryItem | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    setItems(getHistory());
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const handleDelete = (id: string) => {
    setItems(deleteResult(id));
    if (viewItem?.id === id) setViewItem(null);
    showToast('削除しました');
  };

  const handleClearAll = () => {
    clearHistory();
    setItems([]);
    setConfirmClear(false);
    showToast('全件削除しました');
  };

  const loadToInput = (item: HistoryItem) => {
    try {
      localStorage.setItem('askdesign:generated_prompt', item.generated_prompt);
      localStorage.setItem('askdesign:explanation', item.explanation);
      localStorage.setItem('askdesign:inputs', JSON.stringify(item.inputs));
    } catch {
      // ignore
    }
    router.push('/result');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('コピーしました');
    } catch {
      // noop
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Ask Design</h1>
          <p className={styles.sub}>保存済み履歴</p>
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
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            保存済み結果
            <span className={styles.badge}>{items.length}</span>
          </div>

          {items.length > 0 && (
            <button
              className={styles.btnDanger}
              onClick={() => setConfirmClear(true)}
            >
              全件削除
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <p className={styles.muted}>
            保存済みの結果がありません。/result で「保存する」を押すとここに表示されます。
          </p>
        ) : (
          <div className={styles.list}>
            {items.map((item) => (
              <div key={item.id} className={styles.item}>
                <div className={styles.itemMeta}>
                  <span className={styles.itemDate}>{formatDate(item.saved_at)}</span>
                  {item.inputs?.goal && (
                    <span className={styles.itemGoal}>{item.inputs.goal}</span>
                  )}
                </div>

                <p className={styles.itemPreview}>
                  {item.generated_prompt.slice(0, 120)}
                  {item.generated_prompt.length > 120 ? '…' : ''}
                </p>

                <div className={styles.itemActions}>
                  <button
                    className={styles.btnGhost}
                    onClick={() => setViewItem(item)}
                  >
                    全文を見る
                  </button>
                  <button
                    className={styles.btnGhost}
                    onClick={() => copyToClipboard(item.generated_prompt)}
                  >
                    コピー
                  </button>
                  <button
                    className={styles.btnPrimary}
                    onClick={() => loadToInput(item)}
                  >
                    /result で開く
                  </button>
                  <button
                    className={styles.btnDanger}
                    onClick={() => handleDelete(item.id)}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 全文モーダル */}
      {viewItem && (
        <div style={modal.overlay} role="dialog" aria-modal="true">
          <div style={modal.card}>
            <div style={modal.header}>
              <div style={modal.title}>
                {viewItem.inputs?.goal
                  ? viewItem.inputs.goal.slice(0, 50) + (viewItem.inputs.goal.length > 50 ? '…' : '')
                  : '生成結果'}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={modal.copyBtn}
                  onClick={() => copyToClipboard(viewItem.generated_prompt)}
                >
                  コピー
                </button>
                <button
                  style={modal.xBtn}
                  onClick={() => setViewItem(null)}
                  aria-label="閉じる"
                >
                  ✕
                </button>
              </div>
            </div>
            <div style={modal.meta}>{formatDate(viewItem.saved_at)}</div>
            <div style={modal.body}>
              <MarkdownPreview content={viewItem.generated_prompt} />
              {viewItem.explanation && (
                <div style={{ marginTop: 14 }}>
                  <div style={modal.subTitle}>説明</div>
                  <MarkdownPreview content={viewItem.explanation} />
                </div>
              )}
            </div>
            <div style={modal.footer}>
              <button style={modal.loadBtn} onClick={() => { loadToInput(viewItem); setViewItem(null); }}>
                /result で開く
              </button>
              <button style={modal.deleteBtn} onClick={() => handleDelete(viewItem.id)}>
                削除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 全件削除確認モーダル */}
      {confirmClear && (
        <div style={modal.overlay} role="dialog" aria-modal="true">
          <div style={{ ...modal.card, maxWidth: 400 }}>
            <div style={modal.title}>全件削除しますか？</div>
            <p style={{ marginTop: 10, fontSize: 13, color: '#475569' }}>
              保存済み {items.length} 件が削除されます。この操作は取り消せません。
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button style={modal.cancelBtn} onClick={() => setConfirmClear(false)}>
                キャンセル
              </button>
              <button style={modal.deleteBtn} onClick={handleClearAll}>
                全件削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={toastStyle}>
          {toast}
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
    maxWidth: 680,
    background: '#fff',
    borderRadius: 18,
    padding: 18,
    boxShadow: '0 20px 60px rgba(0,0,0,0.20)',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: { fontSize: 15, fontWeight: 900, color: '#0f172a' },
  meta: { fontSize: 12, color: '#94a3b8', fontWeight: 700, marginTop: 4, marginBottom: 10 },
  subTitle: { fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 8 },
  body: { overflowY: 'auto', flex: 1 },
  footer: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14, flexWrap: 'wrap' },
  xBtn: {
    border: '1px solid #e2e8f0',
    background: '#fff',
    borderRadius: 12,
    padding: '6px 10px',
    cursor: 'pointer',
    fontWeight: 900,
  },
  copyBtn: {
    border: '1px solid rgba(148,163,184,.55)',
    background: '#fff',
    borderRadius: 12,
    padding: '6px 12px',
    cursor: 'pointer',
    fontWeight: 900,
    fontSize: 13,
    color: '#0f172a',
  },
  loadBtn: {
    border: 'none',
    background: '#16a34a',
    color: '#fff',
    borderRadius: 12,
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 900,
    fontSize: 13,
  },
  deleteBtn: {
    border: '1px solid rgba(220,38,38,.35)',
    background: 'rgba(220,38,38,.06)',
    color: '#b91c1c',
    borderRadius: 12,
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 900,
    fontSize: 13,
  },
  cancelBtn: {
    border: '1px solid #d1d5db',
    background: '#fff',
    borderRadius: 12,
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 900,
    fontSize: 13,
  },
};

const toastStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 20,
  left: '50%',
  transform: 'translateX(-50%)',
  background: '#0f172a',
  color: '#fff',
  padding: '10px 20px',
  borderRadius: 12,
  fontWeight: 700,
  fontSize: 13,
  zIndex: 1300,
  whiteSpace: 'nowrap',
};
