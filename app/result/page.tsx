'use client';

import { Suspense } from 'react';
import AuthHeader from '../components/AuthHeader';
import styles from './page.module.css';
import ResultClient from './ResultClient';

export default function ResultPage() {
  return (
    <div className={styles.page}>
      <AuthHeader />
      <main className={styles.main}>
        <h1 className={styles.title}>生成結果</h1>
        <p className={styles.sub}>生成されたプロンプトと説明を確認できます。</p>

        <Suspense fallback={<p className={styles.muted}>読み込み中…</p>}>
          <ResultClient />
        </Suspense>
      </main>
    </div>
  );
}
