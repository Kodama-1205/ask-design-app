// app/page.tsx
import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Ask Design</h1>
            <p className={styles.sub}>プロンプト生成ツール</p>
          </div>

          <div className={styles.headerActions}>
            <Link className={styles.btnGhost} href="/input">
              入力
            </Link>
            <Link className={styles.btnPrimary} href="/templates">
              テンプレ
            </Link>
          </div>
        </header>

        <section className={styles.card}>
          <div className={styles.hero}>
            <div className={styles.heroLeft}>
              <div className={styles.badge}>AIプロンプト生成</div>
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
                  すぐ始める
                </Link>
                <Link className={styles.btnGhost} href="/templates">
                  テンプレを見る
                </Link>
              </div>
            </div>

            <div className={styles.heroRight}>
              <div className={styles.previewCard}>
                <div className={styles.previewHead}>
                  <span className={styles.previewDot} />
                  <span className={styles.previewDot} />
                  <span className={styles.previewDot} />
                  <span className={styles.previewLabel}>プレビュー</span>
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
                  <div className={styles.pill}>1クリックコピー</div>
                  <div className={styles.pill}>Markdown</div>
                  <div className={styles.pill}>テンプレ</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.card} style={{ marginTop: 14 }}>
          <div className={styles.grid}>
            <Feature
              title="入力はシンプル"
              desc="目的・背景・スキル・ツールを入れて生成。余計な操作を減らしました。"
            />
            <Feature
              title="出力は見やすく"
              desc="Markdownプレビューとコピー導線で、生成結果をすぐ他AIへ貼り付けできます。"
            />
            <Feature
              title="テンプレ運用"
              desc="良いプロンプトはテンプレ保存。テンプレから入力ページに読み込んで再利用できます。"
            />
          </div>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerLeft}>© {new Date().getFullYear()} Ask Design</div>
          <div className={styles.footerRight}>
            <Link className={styles.footerLink} href="/input">
              入力
            </Link>
            <Link className={styles.footerLink} href="/templates">
              テンプレ
            </Link>
            <Link className={styles.footerLink} href="/history">
              履歴
            </Link>
            <Link className={styles.footerLink} href="/result">
              結果
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
