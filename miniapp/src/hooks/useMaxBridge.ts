import { useCallback, useEffect, useState } from 'react';

const STORAGE_ID_KEY = 'conf_user_id';
const STORAGE_NAME_KEY = 'conf_user_name';
const INIT_DELAY_MS = 500;

type HapticType = 'success' | 'error' | 'warning';

function safeStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // WebView может блокировать storage
  }
}

function readUserFromWebApp(): { userId: number; userName: string } | null {
  const webApp = window.WebApp;
  if (!webApp) {
    return null;
  }

  console.log('[MaxBridge] WebApp found:', Object.keys(webApp));

  const initData = webApp.initDataUnsafe;
  console.log('[MaxBridge] initData:', JSON.stringify(initData));

  const user = initData?.user;
  const rawId = user?.id ?? user?.user_id;
  if (rawId == null || !Number.isInteger(rawId) || rawId <= 0) {
    return null;
  }

  const userName = user?.first_name ?? user?.name ?? '';
  safeStorageSet(STORAGE_ID_KEY, String(rawId));
  safeStorageSet(STORAGE_NAME_KEY, userName);

  return { userId: rawId, userName };
}

export function useMaxBridge() {
  const [userId, setUserId] = useState<number>(0);
  const [userName, setUserName] = useState<string>('');
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    const init = () => {
      if (cancelled) {
        return;
      }

      const fromWebApp = readUserFromWebApp();
      if (fromWebApp) {
        setUserId(fromWebApp.userId);
        setUserName(fromWebApp.userName);
        setIsReady(true);
        return;
      }

      const savedId = safeStorageGet(STORAGE_ID_KEY);
      if (savedId) {
        const parsedId = Number.parseInt(savedId, 10);
        if (Number.isInteger(parsedId) && parsedId > 0) {
          setUserId(parsedId);
          setUserName(safeStorageGet(STORAGE_NAME_KEY) ?? '');
        }
      } else {
        const devId = Math.floor(Math.random() * 900000) + 100000;
        safeStorageSet(STORAGE_ID_KEY, String(devId));
        setUserId(devId);
        setUserName('Гость');
      }

      setIsReady(true);
    };

    if (window.WebApp) {
      init();
    } else {
      window.addEventListener('load', init);
    }

    const timeoutId = window.setTimeout(init, INIT_DELAY_MS);

    return () => {
      cancelled = true;
      window.removeEventListener('load', init);
      window.clearTimeout(timeoutId);
    };
  }, []);

  const haptic = useCallback((type: HapticType) => {
    try {
      const hapticApi = window.WebApp?.HapticFeedback;
      if (hapticApi?.impactOccurred) {
        hapticApi.impactOccurred(type);
        return;
      }
      void hapticApi?.notificationOccurred?.(type);
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
