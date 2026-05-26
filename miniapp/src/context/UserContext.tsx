import { createContext, useContext, type ReactNode } from 'react';
import { useMaxBridge } from '../hooks/useMaxBridge';

export type UserContextValue = ReturnType<typeof useMaxBridge>;

export const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const bridge = useMaxBridge();

  return (
    <UserContext.Provider value={bridge}>{children}</UserContext.Provider>
  );
}

export function useUserContext(): UserContextValue {
  const value = useContext(UserContext);
  if (!value) {
    throw new Error('useUserContext must be used within UserProvider');
  }
  return value;
}
