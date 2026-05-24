import { createContext } from 'react';

export type UserContextValue = {
  userId: number;
  haptic: (type: 'success' | 'error' | 'warning') => void;
};

export const UserContext = createContext<UserContextValue>({
  userId: 0,
  haptic: () => {},
});
