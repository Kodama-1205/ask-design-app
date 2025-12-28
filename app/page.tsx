// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { createClient } from '../lib/supabase/client';

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          router.replace('/input');
          return;
        }
      } catch {
        // ignore（未ログイン扱いでLP表示）
      } finally {
        setChecking(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ ログイン判定中はLPを表示せず、軽量ローディング
  if (checking) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>Ask Design</h1>
              <p className={styles.sub}>Prompt Generator</p>
            </div>
          </header>

          <section className={styles.card}>
            <div className={styles.banner}>読み込み中…</div>
          </section>
        </div>
      </main>
    );
  }

  // ✅ 未ログイン：LP表示
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Ask Design</h1>
            <p className={styles.sub}>Prompt Generator</p>
          </div>

          <div className={styles.headerActions}>
            <Link className={styles.btnGhost} href="/auth/login">
              ログイン
            </Link>
            <Link className={styles.btnPrimary} href="/auth/signup">
              新規登録
            </Link>
          </div>
        </header>

        <section className={styles.card}>
          <div className={styles.hero}>
            <div className={styles.heroLeft}>
              <div className={styles.badge}>AI Prompt Builder</div>
              <h2 className={styles.heroTitle}>
                目的と前提を入れるだけで、
                <br />
                そのまま使える「完成プロンプト」を作成
              </h2>
              <p className={styles.heroDesc}>
                skill_level と tools を反映して、初心者にも上級者にも最適化したプロンプトを生成します。
                <br />
                生成結果は Markdown で見やすく、ワンクリックでコピーできます。
              </p>

              <div className={styles.ctaRow}>
                <Link className={styles.btnPrimary} href="/input">
                  すぐ始める（/input）
                </Link>
                <Link className={styles.btnGhost} href="/templates">
                  テンプレを見る（/templates）
                </Link>
              </div>

              <div className={styles.note}>
                ※ ログインしている場合は、そのまま /input へ進めます（未ログインならログインへ誘導されます）
              </div>
            </div>

            <div className={styles.heroRight}>
              <div className={styles.previewCard}>
                <div className={styles.previewHead}>
                  <span className={styles.previewDot} />
                  <span className={styles.previewDot} />
                  <span className={styles.previewDot} />
                  <span className={styles.previewLabel}>Preview</span>
                </div>

                <div className={styles.previewBody}>
                  <div className={styles.previewTitle}>生成結果（例）</div>
                  <pre className={styles.previewCode}>
{`【役割】
あなたはレポート自動化の専門家です。

【目的】
Excelで集計した数値をSlackへ共有する週次運用を自動化したい

【前提】
初心者 / 使用ツール: Excel, Slack

【手順】
1. データ入力形式を統一（列定義と例）
2. ピボット or 関数で集計（例付き）
3. Slack投稿メッセージをテンプレ化
4. 確認ポイント（ミス防止）…`}
                  </pre>
                </div>

                <div className={styles.previewFoot}>
                  <div className={styles.pill}>Copy 1 click</div>
                  <div className={styles.pill}>Markdown</div>
                  <div className={styles.pill}>Templates</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.card} style={{ marginTop: 14 }}>
          <div className={styles.grid}>
            <Feature
              title="入力はシンプル"
              desc="Goal / Context / skill_level / tools を入れて生成。余計な操作を減らしました。"
            />
            <Feature
              title="出力は見やすく"
              desc="Markdownプレビューとコピー導線で、生成結果をすぐ他AIへ貼り付けできます。"
            />
            <Feature
              title="テンプレ運用"
              desc="良いプロンプトはテンプレ保存。/templates から /input に読み込んで再利用できます。"
            />
          </div>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerLeft}>© {new Date().getFullYear()} Ask Design</div>
          <div className={styles.footerRight}>
            <Link className={styles.footerLink} href="/input">
              /input
            </Link>
            <Link className={styles.footerLink} href="/templates">
              /templates
            </Link>
            <Link className={styles.footerLink} href="/result">
              /result
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className={styles.feature}>
      <div className={styles.featureTitle}>{title}</div>
      <div className={styles.featureDesc}>{desc}</div>
    </div>
  );
}
