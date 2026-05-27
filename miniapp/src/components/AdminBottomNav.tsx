import {
  Layers,
  LayoutDashboard,
  MoreHorizontal,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import BottomNavShell from './BottomNavShell';
import navStyles from './BottomNavShell.module.css';

const tabs: { path: string; label: string; Icon: LucideIcon }[] = [
  { path: '/admin', label: 'Панель', Icon: LayoutDashboard },
  { path: '/admin/users', label: 'Люди', Icon: Users },
  { path: '/admin/content', label: 'Контент', Icon: Layers },
  { path: '/admin/more', label: 'Ещё', Icon: MoreHorizontal },
];

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
      {tabs.map(({ path, label, Icon }) => {
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
              <Icon strokeWidth={active ? 2.25 : 1.75} />
            </span>
            <span className={navStyles.label}>{label}</span>
          </Link>
        );
      })}
    </BottomNavShell>
  );
}
