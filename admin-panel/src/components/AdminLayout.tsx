import type { LucideIcon } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
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
  { to: '/schedule', label: 'Расписание', icon: panelIcons.schedule },
  { to: '/quiz', label: 'Квиз', icon: panelIcons.quiz },
  { to: '/questions', label: 'Вопросы', icon: panelIcons.questions },
  { to: '/feedback', label: 'Отзывы', icon: panelIcons.feedback },
  { to: '/notifications', label: 'Рассылки', icon: panelIcons.notifications },
  { to: '/settings', label: 'Настройки', icon: panelIcons.settings },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
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

      <main className="min-w-0 flex-1 overflow-y-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
