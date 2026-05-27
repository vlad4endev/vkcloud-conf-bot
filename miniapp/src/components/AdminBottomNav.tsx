import { Link, useLocation } from 'react-router-dom';
import styles from './BottomNav.module.css';

const tabs = [
  { path: '/admin', label: 'Панель', icon: '⚙️' },
  { path: '/admin/users', label: 'Люди', icon: '👥' },
  { path: '/admin/content', label: 'Контент', icon: '📋' },
  { path: '/admin/more', label: 'Ещё', icon: '⋯' },
] as const;

function isActive(pathname: string, tabPath: string): boolean {
  if (tabPath === '/admin') {
    return pathname === '/admin';
  }
  if (tabPath === '/admin/content') {
    return (
      pathname.startsWith('/admin/content') ||
      pathname.startsWith('/admin/speakers') ||
      pathname.startsWith('/admin/schedule') ||
      pathname.startsWith('/admin/quiz')
    );
  }
  if (tabPath === '/admin/more') {
    return (
      pathname.startsWith('/admin/more') ||
      pathname.startsWith('/admin/questions') ||
      pathname.startsWith('/admin/feedback') ||
      pathname.startsWith('/admin/notify') ||
      pathname.startsWith('/admin/settings')
    );
  }
  return pathname.startsWith(tabPath);
}

export default function AdminBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className={styles.nav} aria-label="Админ-навигация">
      {tabs.map(({ path, label, icon }) => {
        const active = isActive(pathname, path);
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
