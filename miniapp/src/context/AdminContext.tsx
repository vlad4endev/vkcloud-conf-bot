import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  clearAdminSession,
  getAdminToken,
  unlockAdmin,
  type AdminSession,
} from '../api/adminClient';

interface AdminContextValue {
  isAdminMode: boolean;
  admin: AdminSession['admin'] | null;
  unlock: (codeWord: string) => Promise<void>;
  exitAdminMode: () => void;
  showUnlockModal: boolean;
  openUnlockModal: () => void;
  closeUnlockModal: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdminMode, setIsAdminMode] = useState(() => Boolean(getAdminToken()));
  const [admin, setAdmin] = useState<AdminSession['admin'] | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  const exitAdminMode = useCallback(() => {
    clearAdminSession();
    setIsAdminMode(false);
    setAdmin(null);
  }, []);

  const unlock = useCallback(async (codeWord: string) => {
    const session = await unlockAdmin(codeWord);
    setAdmin(session.admin);
    setIsAdminMode(true);
    setShowUnlockModal(false);
  }, []);

  const value = useMemo(
    () => ({
      isAdminMode,
      admin,
      unlock,
      exitAdminMode,
      showUnlockModal,
      openUnlockModal: () => setShowUnlockModal(true),
      closeUnlockModal: () => setShowUnlockModal(false),
    }),
    [isAdminMode, admin, unlock, exitAdminMode, showUnlockModal],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return ctx;
}
