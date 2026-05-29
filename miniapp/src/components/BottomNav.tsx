import { Link, useLocation } from 'react-router-dom';
import { appIcons } from '../icons';
import AppIcon from './AppIcon';
import BottomNavShell from './BottomNavShell';
import navStyles from './BottomNavShell.module.css';

const tabs = [
  { path: '/', label: 'О конференции', icon: appIcons.home },
  { path: '/schedule', label: 'Программа', icon: appIcons.schedule },
  { path: '/quiz', label: 'Квиз', icon: appIcons.quiz },
  { path: '/speakers', label: 'Вопросы спикеру', icon: appIcons.speakers },
] as const;

function isTabActive(pathname: string, tabPath: string): boolean {
  switch (tabPath) {
    case '/':
      return (
        pathname === '/' ||
        pathname === '/map' ||
        pathname === '/feedback' ||
        pathname === '/partners'
      );
    case '/schedule':
      return pathname === '/schedule';
    case '/quiz':
      return pathname === '/quiz';
    case '/speakers':
      return pathname === '/speakers' || pathname.startsWith('/speakers/');
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
