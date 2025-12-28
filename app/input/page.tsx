// app/input/page.tsx
import { Suspense } from 'react';
import AuthHeader from '../components/AuthHeader';
import styles from './page.module.css';
import InputClient from './InputClient';

export default function InputPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <AuthHeader />

        <Suspense fallback={<div className={styles.card}>読み込み中...</div>}>
          <InputClient />
        </Suspense>
      </div>
    </main>
  );
}
