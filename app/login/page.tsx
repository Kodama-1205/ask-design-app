import AuthHeader from '../components/AuthHeader';
import styles from './page.module.css';
import LoginClient from './LoginClient';

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <AuthHeader />

      <main className={styles.main}>
        <LoginClient />
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerText}>Ask Design</span>
      </footer>
    </div>
  );
}
