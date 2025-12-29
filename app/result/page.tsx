// app/result/page.tsx
import { Suspense } from 'react';
import styles from './page.module.css';
import AuthHeader from '../components/AuthHeader';
import ResultClient from './ResultClient';

export default function ResultPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <AuthHeader />

        <Suspense fallback={<div className={styles.card}>読み込み中...</div>}>
          <ResultClient />
        </Suspense>
      </div>
    </main>
  );
}
