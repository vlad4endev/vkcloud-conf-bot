export type UserState = 'waiting_data' | 'registered';

/** @deprecated Use UserState */
export type SessionState = UserState;

export type UserSession = {
  state: UserState;
};

export const sessions = new Map<number, UserSession>();
