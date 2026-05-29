import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import AdminBottomNav from './AdminBottomNav';
import AdminUnlockModal from './AdminUnlockModal';
import BackButton from './BackButton';
import BottomNav from './BottomNav';
import ConfDecor from './ConfDecor';
import VkTechLogo from './VkTechLogo';
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
      <ConfDecor />
      <header className={styles.header}>
        <div className={styles.headerBrand}>
          <VkTechLogo size="sm" />
          <span className={styles.eventTitle}>
            VK Cloud Conf<span className={styles.eventMark}>&apos;26</span>
          </span>
        </div>
        <div className={styles.headerMeta}>
          {isAdminMode ? <span className="adminBadge">Админ</span> : null}
          <button
            type="button"
            className={styles.date}
            onClick={handleDateTap}
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
