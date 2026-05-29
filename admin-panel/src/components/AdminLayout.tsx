import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppIcon from './AppIcon';
import { panelIcons } from '../icons';

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

const navItems: NavItem[] = [
  { to: '/', label: 'Обзор', icon: panelIcons.overview, end: true },
  { to: '/users', label: 'Участники', icon: panelIcons.users },
  { to: '/speakers', label: 'Спикеры', icon: panelIcons.speakers },
  { to: '/partners', label: 'Партнёры', icon: panelIcons.partners },
  { to: '/schedule', label: 'Расписание', icon: panelIcons.schedule },
  { to: '/quiz', label: 'Квиз', icon: panelIcons.quiz },
  { to: '/questions', label: 'Вопросы', icon: panelIcons.questions },
  { to: '/feedback', label: 'Отзывы', icon: panelIcons.feedback },
  { to: '/notifications', label: 'Рассылки', icon: panelIcons.notifications },
  { to: '/settings', label: 'Настройки', icon: panelIcons.settings },
];

export default function AdminLayout() {
  const location = useLocation();
  const { admin, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const mobilePrimaryItems = navItems.slice(0, 4);
  const mobileMoreItems = navItems.slice(4);
  const isMoreActive = mobileMoreItems.some((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
  );

  useEffect(() => {
    if (!moreOpen) {
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [moreOpen]);

  const closeMore = () => setMoreOpen(false);

  return (
    <div className="flex min-h-screen bg-[#0a0f1e]">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:flex">
        <div className="border-b border-[var(--color-border)] px-4 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            VK Cloud Conf
          </p>
          <p className="mt-1 text-lg font-bold text-white">Админ-панель</p>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <AppIcon icon={icon} size="nav" active={isActive} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[var(--color-border)] p-3">
          <p className="truncate px-3 text-xs text-slate-500">{admin?.email}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <AppIcon icon={panelIcons.logout} size="sm" />
            Выйти
          </button>
        </div>
      </aside>

      <div className="fixed inset-x-0 top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur lg:hidden">
        <div className="px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            VK Cloud Conf
          </p>
          <p className="truncate text-base font-semibold text-white">Админ-панель</p>
        </div>
      </div>

      {moreOpen ? (
        <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={closeMore} />
      ) : null}

      <div
        className={`fixed inset-x-0 bottom-0 z-30 rounded-t-2xl border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-transform duration-200 lg:hidden ${
          moreOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-hidden={!moreOpen}
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Еще разделы</p>
          <button
            type="button"
            onClick={closeMore}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Закрыть"
          >
            <AppIcon icon={panelIcons.close} size="md" />
          </button>
        </div>
        <nav className="space-y-1.5">
          {mobileMoreItems.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={closeMore}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <AppIcon icon={icon} size="nav" active={isActive} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-3 border-t border-[var(--color-border)] pt-3">
          <p className="truncate px-3 text-xs text-slate-500">{admin?.email}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <AppIcon icon={panelIcons.logout} size="sm" />
            Выйти
          </button>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 lg:hidden">
        <ul className="grid grid-cols-5 gap-1">
          {mobilePrimaryItems.map(({ to, label, icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1 text-[10px] font-medium transition ${
                    isActive
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <AppIcon icon={icon} size="sm" active={isActive} />
                    <span className="truncate">{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={`flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-lg px-1 py-1 text-[10px] font-medium transition ${
                isMoreActive || moreOpen
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
              aria-label="Еще разделы"
              aria-expanded={moreOpen}
            >
              <AppIcon icon={panelIcons.menu} size="sm" active={isMoreActive || moreOpen} />
              <span>Еще</span>
            </button>
          </li>
        </ul>
      </nav>

      <main className="min-w-0 flex-1 overflow-y-auto px-4 pb-24 pt-20 sm:px-6 sm:pb-28 sm:pt-24 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
