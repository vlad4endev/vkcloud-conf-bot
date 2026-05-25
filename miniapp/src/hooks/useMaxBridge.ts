import { useCallback, useEffect, useState } from 'react';

declare global {
  interface Window {
    MaxBridge?: {
      initData?: string;
      getUserInfo: () => Promise<{ userId: number; name: string }>;
      close: () => void;
      hapticFeedback: (type: 'success' | 'error' | 'warning') => void;
    };
  }
}

const STORAGE_KEY = 'conf_user_id';
const DEV_STORAGE_KEY = 'dev_user_id';
const BRIDGE_TIMEOUT_MS = 2500;

type HapticType = 'success' | 'error' | 'warning';

function parsePositiveInt(raw: string | null): number | null {
  if (!raw) {
    return null;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    return null;
  }

  return value;
}

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
    // WebView may block storage — app should still work
  }
}

function readStoredUserId(): number | null {
  return parsePositiveInt(safeStorageGet(STORAGE_KEY));
}

function readUrlUserId(): number | null {
  const params = new URLSearchParams(window.location.search);
  return parsePositiveInt(params.get('userId'));
}

function getOrCreateDevUserId(): number {
  const devId =
    parsePositiveInt(safeStorageGet(DEV_STORAGE_KEY)) ??
    Math.floor(Math.random() * 900000) + 100000;
  safeStorageSet(DEV_STORAGE_KEY, String(devId));
  return devId;
}

function resolveFallbackUserId(): number {
  const fromStorage = readStoredUserId();
  if (fromStorage !== null) {
    return fromStorage;
  }

  const fromUrl = readUrlUserId();
  if (fromUrl !== null) {
    safeStorageSet(STORAGE_KEY, String(fromUrl));
    return fromUrl;
  }

  return getOrCreateDevUserId();
}

function readWebAppUser(): { userId: number; name: string } | null {
  try {
    const user = window.WebApp?.initDataUnsafe?.user;
    if (!user) {
      return null;
    }

    const userId = user.id ?? user.user_id;
    if (userId == null || !Number.isInteger(userId) || userId <= 0) {
      return null;
    }

    const name = user.first_name ?? user.name ?? '';
    safeStorageSet(STORAGE_KEY, String(userId));
    return { userId, name };
  } catch {
    return null;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error('bridge_timeout'));
    }, ms);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

async function resolveUserId(): Promise<{ userId: number; name: string }> {
  const fromWebApp = readWebAppUser();
  if (fromWebApp) {
    return fromWebApp;
  }

  const legacyBridge = window.MaxBridge;
  if (legacyBridge) {
    try {
      const info = await withTimeout(legacyBridge.getUserInfo(), BRIDGE_TIMEOUT_MS);
      if (info.userId > 0) {
        safeStorageSet(STORAGE_KEY, String(info.userId));
        return { userId: info.userId, name: info.name };
      }
    } catch {
      // fall through
    }
  }

  return { userId: resolveFallbackUserId(), name: '' };
}

export function useMaxBridge() {
  const [userId, setUserId] = useState(() => resolveFallbackUserId());
  const [userName, setUserName] = useState('');

  useEffect(() => {
    let cancelled = false;

    void resolveUserId()
      .then(({ userId: resolvedId, name }) => {
        if (cancelled) {
          return;
        }
        setUserId(resolvedId);
        setUserName(name);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setUserId(resolveFallbackUserId());
        setUserName('');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const close = useCallback(() => {
    window.WebApp?.close?.();
    window.MaxBridge?.close();
  }, []);

  const haptic = useCallback((type: HapticType) => {
    const webAppHaptic = window.WebApp?.HapticFeedback;
    if (webAppHaptic) {
      void webAppHaptic.notificationOccurred(type).catch(() => {});
      return;
    }
    window.MaxBridge?.hapticFeedback(type);
  }, []);

  return { userId, userName, close, haptic };
}
