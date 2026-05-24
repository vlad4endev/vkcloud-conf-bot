export type SessionState = 'waiting_data' | 'registered';

export type UserSession = {
  state: SessionState;
};

export const sessions = new Map<number, UserSession>();
