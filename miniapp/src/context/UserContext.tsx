import { createContext, useContext } from 'react';

export const UNAUTHORIZED_ERROR = 'Пользователь не авторизован';

export type UserContextValue = {
  userId: number;
  haptic: (type: 'success' | 'error' | 'warning') => void;
};

export function createUserContextValue(
  userId: number,
  haptic: UserContextValue['haptic'],
): UserContextValue {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error(UNAUTHORIZED_ERROR);
  }

  return { userId, haptic };
}

export const UserContext = createContext<UserContextValue | null>(null);

export function useUserContext(): UserContextValue {
  const value = useContext(UserContext);
  if (!value) {
    throw new Error(UNAUTHORIZED_ERROR);
  }
  return value;
}
