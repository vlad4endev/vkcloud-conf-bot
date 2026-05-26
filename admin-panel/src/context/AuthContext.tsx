import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { clearSession, getStoredAdmin, getStoredToken } from '../api/client';
import type { AdminInfo } from '../api/types';

interface AuthContextValue {
  isAuthenticated: boolean;
  admin: AdminInfo | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const token = getStoredToken();
  const admin = getStoredAdmin();

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(token),
      admin,
      logout: () => {
        clearSession();
        window.location.href = '/panel/login';
      },
    }),
    [token, admin],
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
