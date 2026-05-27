import { Link, useLocation } from 'react-router-dom';
import { appIcons } from '../icons';
import AppIcon from './AppIcon';
import BottomNavShell from './BottomNavShell';
import navStyles from './BottomNavShell.module.css';

const tabs = [
  { path: '/admin', label: 'Панель', icon: appIcons.admin },
  { path: '/admin/users', label: 'Люди', icon: appIcons.users },
  { path: '/admin/content', label: 'Контент', icon: appIcons.content },
  { path: '/admin/more', label: 'Ещё', icon: appIcons.more },
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
    <BottomNavShell ariaLabel="Админ-навигация">
      {tabs.map(({ path, label, icon }) => {
        const active = isActive(pathname, path);
        return (
          <Link
            key={path}
            to={path}
            className={
              active
                ? `${navStyles.link} ${navStyles.linkActive}`
                : navStyles.link
            }
            aria-current={active ? 'page' : undefined}
            aria-label={label}
          >
            <span className={navStyles.icon} aria-hidden>
              <AppIcon icon={icon} fill active={active} />
            </span>
            <span className={navStyles.label}>{label}</span>
          </Link>
        );
      })}
    </BottomNavShell>
  );
}
