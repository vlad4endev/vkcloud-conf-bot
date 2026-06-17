import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/users', label: 'Зарегистрированные', end: true },
  { to: '/users/unregistered', label: 'Не зарегистрированные', end: false },
] as const;

export default function UsersLayout() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-4">
        {tabs.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `rounded-lg px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
