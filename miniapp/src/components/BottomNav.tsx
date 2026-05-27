import {
  CalendarDays,
  Gamepad2,
  Home,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import BottomNavShell from './BottomNavShell';
import navStyles from './BottomNavShell.module.css';

const tabs: { path: string; label: string; Icon: LucideIcon }[] = [
  { path: '/', label: 'Главная', Icon: Home },
  { path: '/schedule-hub', label: 'Программа', Icon: CalendarDays },
  { path: '/quiz', label: 'Квиз', Icon: Gamepad2 },
  { path: '/feedback', label: 'Связь', Icon: MessageCircle },
];

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
    <BottomNavShell ariaLabel="Основная навигация">
      {tabs.map(({ path, label, Icon }) => {
        const active = isTabActive(pathname, path);
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
