import { Link, useLocation } from 'react-router-dom'
import styles from './BottomNav.module.css'

const tabs = [
  { path: '/', label: 'Главная', icon: '🏠', match: (p: string) => p === '/' },
  {
    path: '/schedule',
    label: 'Программа',
    icon: '📅',
    match: (p: string) => p === '/schedule' || p.startsWith('/schedule/'),
  },
  {
    path: '/speakers',
    label: 'Спикеры',
    icon: '👥',
    match: (p: string) => p === '/speakers' || p.startsWith('/speakers/'),
  },
  { path: '/quiz', label: 'Квиз', icon: '🎮', match: (p: string) => p === '/quiz' || p.startsWith('/quiz/') },
] as const

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className={styles.nav} aria-label="Основная навигация">
      {tabs.map(({ path, label, icon, match }) => {
        const active = match(pathname)
        return (
          <Link
            key={path}
            to={path}
            className={active ? `${styles.link} ${styles.linkActive}` : styles.link}
            aria-current={active ? 'page' : undefined}
          >
            <span className={styles.icon} aria-hidden>
              {icon}
            </span>
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
