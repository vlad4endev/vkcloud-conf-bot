import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  clearSession,
  getStoredAdmin,
  getStoredToken,
} from '../api/client';
import type { AdminInfo } from '../api/types';

interface AuthContextValue {
  isAuthenticated: boolean;
  admin: AdminInfo | null;
  refreshSession: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession() {
  return {
    token: getStoredToken(),
    admin: getStoredAdmin(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(readSession);

  const refreshSession = useCallback(() => {
    setSession(readSession());
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession({ token: null, admin: null });
    window.location.assign('/panel/login');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(session.token),
      admin: session.admin,
      refreshSession,
      logout,
    }),
    [session, refreshSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
