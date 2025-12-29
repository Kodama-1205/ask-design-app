// app/result/MarkdownPreview.tsx
'use client';

import styles from './page.module.css';

export default function MarkdownPreview({ content }: { content: string }) {
  return <pre className={styles.pre}>{content}</pre>;
}
