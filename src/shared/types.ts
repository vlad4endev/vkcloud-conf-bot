export type UserState = 'waiting_data' | 'registered';

export type UserSession = {
  state: UserState;
  createdAt: number;
};

export const sessions = new Map<number, UserSession>();

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const SESSION_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

setInterval(() => {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [userId, session] of sessions) {
    if (session.createdAt < cutoff) {
      sessions.delete(userId);
    }
  }
}, SESSION_CLEANUP_INTERVAL_MS);
