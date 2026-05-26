import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import AdminBottomNav from './AdminBottomNav';
import AdminUnlockModal from './AdminUnlockModal';
import BackButton from './BackButton';
import BottomNav from './BottomNav';
import styles from './Layout.module.css';

export default function Layout() {
  const { isAdminMode, openUnlockModal } = useAdmin();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [dateTaps, setDateTaps] = useState(0);

  function handleDateTap() {
    const next = dateTaps + 1;
    setDateTaps(next);
    if (next >= 5) {
      setDateTaps(0);
      openUnlockModal();
    }
  }

  const showAdminNav = isAdminMode && isAdminRoute;

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <span className={styles.logo}>VK CLOUD CONF</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isAdminMode ? <span className="adminBadge">Админ</span> : null}
          <button
            type="button"
            className={styles.date}
            onClick={handleDateTap}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            aria-label="Дата мероприятия"
          >
            17.06.2026
          </button>
        </div>
      </header>
      <div className={styles.brandLine} aria-hidden />
      <main className={styles.main}>
        <BackButton />
        <Outlet />
      </main>
      {showAdminNav ? <AdminBottomNav /> : <BottomNav />}
      <AdminUnlockModal />
    </div>
  );
}
