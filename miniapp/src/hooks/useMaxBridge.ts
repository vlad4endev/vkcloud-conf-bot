import { useCallback, useEffect, useState } from 'react';
import {
  createDevUser,
  readStoredUser,
  readWebAppUser,
  resolveInitialUser,
  type WebAppUser,
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
    let settled = false;
    let attempts = 0;

    const applyUser = (user: WebAppUser, finalize = false) => {
      if (cancelled) {
        return;
      }

      setUserId((prev) => (prev === user.userId ? prev : user.userId));
      setUserName((prev) => (prev === user.userName ? prev : user.userName));
      setIsReady(true);

      if (finalize) {
        settled = true;
      }
    };

    const fromWebApp = readWebAppUser();
    if (fromWebApp) {
      applyUser(fromWebApp, true);
      return () => {
        cancelled = true;
      };
    }

    const fromStorage = readStoredUser();
    if (fromStorage) {
      applyUser(fromStorage);
    }

    const pollId = window.setInterval(() => {
      if (cancelled || settled) {
        window.clearInterval(pollId);
        return;
      }

      const webAppUser = readWebAppUser();
      if (webAppUser) {
        applyUser(webAppUser, true);
        window.clearInterval(pollId);
        return;
      }

      attempts += 1;
      if (attempts >= POLL_MAX_ATTEMPTS) {
        if (!fromStorage) {
          applyUser(createDevUser(), true);
        } else {
          settled = true;
        }
        window.clearInterval(pollId);
      }
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
    };
  }, []);

  const haptic = useCallback((type: HapticType) => {
    try {
      void window.WebApp?.HapticFeedback?.notificationOccurred?.(type)?.catch?.(
        () => undefined,
      );
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
