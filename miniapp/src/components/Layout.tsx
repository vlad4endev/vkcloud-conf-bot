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
  const [logoTaps, setLogoTaps] = useState(0);

  function handleLogoTap() {
    const next = logoTaps + 1;
    setLogoTaps(next);
    if (next >= 5) {
      setLogoTaps(0);
      openUnlockModal();
    }
  }

  const showAdminNav = isAdminMode && isAdminRoute;

  return (
    <div className={styles.layout}>
      <ConfDecor />
      <header className={styles.header}>
        <button
          type="button"
          className={styles.logoBtn}
          onClick={handleLogoTap}
          aria-label="VK tech"
        >
          <VkTechLogo size="header" />
        </button>
        {isAdminMode ? (
          <div className={styles.headerMeta}>
            <span className="adminBadge">Админ</span>
          </div>
        ) : null}
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
