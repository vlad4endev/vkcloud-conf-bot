import { Link, useLocation } from 'react-router-dom';
import { appIcons } from '../icons';
import AppIcon from './AppIcon';
import BottomNavShell from './BottomNavShell';
import navStyles from './BottomNavShell.module.css';

const tabs = [
  { path: '/', label: 'Главная', icon: appIcons.home },
  { path: '/schedule-hub', label: 'Программа', icon: appIcons.schedule },
  { path: '/quiz', label: 'Квиз', icon: appIcons.quiz },
  { path: '/feedback', label: 'Связь', icon: appIcons.feedback },
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
    <BottomNavShell ariaLabel="Основная навигация">
      {tabs.map(({ path, label, icon }) => {
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
              <AppIcon icon={icon} fill active={active} />
            </span>
            <span className={navStyles.label}>{label}</span>
          </Link>
        );
      })}
    </BottomNavShell>
  );
}
