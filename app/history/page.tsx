// app/history/page.tsx
import { Suspense } from 'react';
import styles from './page.module.css';
import HistoryClient from './HistoryClient';

export default function HistoryPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Suspense fallback={<div className={styles.card}>読み込み中...</div>}>
          <HistoryClient />
        </Suspense>
      </div>
    </main>
  );
}
