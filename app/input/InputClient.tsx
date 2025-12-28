// app/input/InputClient.tsx
'use client';

import styles from './page.module.css';

export default function InputClient() {
  // ✅ ここに、元の app/input/page.tsx の中身（useSearchParams含む）を移します
  // いまはビルドを先に通すための仮コンポーネントです
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <h1 className={styles.title}>入力</h1>
        <p className={styles.subtitle}>
          この画面の本体ロジックを InputClient に移植します（次の手順でこちらで完成させます）。
        </p>
      </div>
    </section>
  );
}
