import { useCallback, useEffect, useState } from 'react';
import {
  createDevUser,
  readStoredUser,
  readWebAppUser,
  resolveInitialUser,
} from '../lib/webApp';

type HapticType = 'success' | 'error' | 'warning';

const POLL_MS = 100;
const POLL_MAX_ATTEMPTS = 30;

export function useMaxBridge() {
  const [initialUser] = useState(() => resolveInitialUser());
  const [userId, setUserId] = useState<number>(initialUser.userId);
  const [userName, setUserName] = useState<string>(initialUser.userName);
  const [isReady, setIsReady] = useState<boolean>(initialUser.userId > 0);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const applyUser = (user: { userId: number; userName: string }) => {
      if (cancelled) {
        return;
      }
      setUserId(user.userId);
      setUserName(user.userName);
      setIsReady(true);
    };

    const init = () => {
      if (cancelled) {
        return;
      }

      const fromWebApp = readWebAppUser();
      if (fromWebApp) {
        console.log('[MaxBridge] user from WebApp:', fromWebApp.userId);
        applyUser(fromWebApp);
        return;
      }

      const fromStorage = readStoredUser();
      if (fromStorage) {
        applyUser(fromStorage);
        return;
      }

      if (attempts >= POLL_MAX_ATTEMPTS) {
        applyUser(createDevUser());
        return;
      }

      attempts += 1;
    };

    init();

    const pollId = window.setInterval(init, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
    };
  }, []);

  const haptic = useCallback((type: HapticType) => {
    try {
      void window.WebApp?.HapticFeedback?.notificationOccurred?.(type);
    } catch {
      // ignore
    }
  }, []);

  const close = useCallback(() => {
    try {
      window.WebApp?.close?.();
    } catch {
      // ignore
    }
  }, []);

  return { userId, userName, isReady, haptic, close };
}
