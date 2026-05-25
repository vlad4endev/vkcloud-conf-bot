import { Outlet } from 'react-router-dom';
import BackButton from './BackButton';
import BottomNav from './BottomNav';
import styles from './Layout.module.css';

export default function Layout() {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <span className={styles.logo}>VK CLOUD CONF</span>
        <span className={styles.date}>17.06.2026</span>
      </header>
      <div className={styles.brandLine} aria-hidden />
      <main className={styles.main}>
        <BackButton />
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
