import { Link, useLocation } from 'react-router-dom';
import styles from './BottomNav.module.css';

const tabs = [
  { path: '/', label: 'Главная', icon: '🏠' },
  { path: '/schedule-hub', label: 'Программа', icon: '📋' },
  { path: '/quiz', label: 'Квиз', icon: '🎮' },
  { path: '/feedback', label: 'Связь', icon: '💬' },
] as const;

function isTabActive(pathname: string, tabPath: string): boolean {
  switch (tabPath) {
    case '/':
      return pathname === '/';
    case '/schedule-hub':
      return (
        pathname === '/schedule-hub' ||
        pathname === '/map' ||
        pathname === '/schedule' ||
        pathname === '/speakers' ||
        pathname.startsWith('/speakers/')
      );
    case '/quiz':
      return pathname === '/quiz';
    case '/feedback':
      return pathname === '/feedback';
    default:
      return false;
  }
}

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className={styles.nav} aria-label="Основная навигация">
      {tabs.map(({ path, label, icon }) => {
        const active = isTabActive(pathname, path);
        return (
          <Link
            key={path}
            to={path}
            className={active ? `${styles.link} ${styles.linkActive}` : styles.link}
            aria-current={active ? 'page' : undefined}
          >
            <span className={styles.icon} aria-hidden>
              {icon}
            </span>
            <span className={styles.label}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
