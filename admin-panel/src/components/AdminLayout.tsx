import {
  Calendar,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquare,
  Settings,
  Trophy,
  UserCircle,
  Users,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Обзор', icon: LayoutDashboard, end: true },
  { to: '/users', label: 'Участники', icon: Users },
  { to: '/speakers', label: 'Спикеры', icon: UserCircle },
  { to: '/schedule', label: 'Расписание', icon: Calendar },
  { to: '/quiz', label: 'Квиз', icon: Trophy },
  { to: '/questions', label: 'Вопросы', icon: HelpCircle },
  { to: '/feedback', label: 'Отзывы', icon: MessageSquare },
  { to: '/notifications', label: 'Рассылки', icon: Megaphone },
  { to: '/settings', label: 'Настройки', icon: Settings },
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
          {navItems.map(({ to, label, icon: Icon, end }) => (
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
              <Icon size={18} />
              {label}
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
            <LogOut size={16} />
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
