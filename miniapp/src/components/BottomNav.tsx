import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getConfig } from '../api/client';
import { isQuizVisibleInApp } from '../lib/quizVisibility';
import { appIcons } from '../icons';
import AppIcon from './AppIcon';
import BottomNavShell from './BottomNavShell';
import navStyles from './BottomNavShell.module.css';

const baseTabs = [
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
  const [quizVisible, setQuizVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const sync = () => {
      getConfig()
        .then((config) => {
          if (!cancelled) {
            setQuizVisible(isQuizVisibleInApp(config));
          }
        })
        .catch(() => {
          if (!cancelled) {
            setQuizVisible(true);
          }
        });
    };

    sync();
    const timer = window.setInterval(sync, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const tabs = baseTabs.filter((tab) => tab.path !== '/quiz' || quizVisible);

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
