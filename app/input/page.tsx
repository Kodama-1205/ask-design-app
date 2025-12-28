// app/input/page.tsx
'use client';

import { Suspense } from 'react';
import styles from './page.module.css';
import AuthHeader from '../components/AuthHeader';
import InputClient from './InputClient';

export default function InputPage() {
  return (
    <div className={styles.page}>
      <AuthHeader />

      <main className={styles.main}>
        <div className={styles.container}>
          <Suspense fallback={<div className={styles.card}>読み込み中...</div>}>
            <InputClient />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
