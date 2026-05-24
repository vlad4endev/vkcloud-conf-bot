import { Outlet } from 'react-router-dom'
import BackButton from './BackButton'
import BottomNav from './BottomNav'
import styles from './Layout.module.css'

export default function Layout() {
  return (
    <div className={styles.layout}>
      <BackButton />
      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
