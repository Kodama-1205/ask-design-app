// app/result/page.tsx
import { Suspense } from 'react';
import styles from './page.module.css';
import AuthHeader from '../components/AuthHeader';
import ResultClient from './ResultClient';

export default function ResultPage() {
  return (
    <div className={styles.page}>
      <AuthHeader />

      <main className={styles.main}>
        <div className={styles.container}>
          <Suspense fallback={<div className={styles.card}><p className={styles.muted}>読み込み中...</p></div>}>
            <ResultClient />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
