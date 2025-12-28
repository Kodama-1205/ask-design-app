// app/templates/page.tsx
import { Suspense } from 'react';
import AuthHeader from '../components/AuthHeader';
import styles from './page.module.css';
import TemplatesClient from './TemplatesClient';

export default function TemplatesPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <AuthHeader />

        <Suspense fallback={<div className={styles.card}>読み込み中...</div>}>
          <TemplatesClient />
        </Suspense>
      </div>
    </main>
  );
}
