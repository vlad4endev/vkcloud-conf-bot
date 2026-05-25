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

function readStoredUserId(): number | null {
  return parsePositiveInt(localStorage.getItem(STORAGE_KEY));
}

function readUrlUserId(): number | null {
  const params = new URLSearchParams(window.location.search);
  return parsePositiveInt(params.get('userId'));
}

function getOrCreateDevUserId(): number {
  const devId =
    parsePositiveInt(localStorage.getItem(DEV_STORAGE_KEY)) ??
    Math.floor(Math.random() * 900000) + 100000;
  localStorage.setItem(DEV_STORAGE_KEY, String(devId));
  return devId;
}

function resolveFallbackUserId(): number {
  const fromStorage = readStoredUserId();
  if (fromStorage !== null) {
    return fromStorage;
  }

  const fromUrl = readUrlUserId();
  if (fromUrl !== null) {
    localStorage.setItem(STORAGE_KEY, String(fromUrl));
    return fromUrl;
  }

  return getOrCreateDevUserId();
}

function readWebAppUser(): { userId: number; name: string } | null {
  const user = window.WebApp?.initDataUnsafe?.user;
  if (!user) {
    return null;
  }

  const userId = user.id ?? user.user_id;
  if (userId == null || !Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  const name = user.first_name ?? user.name ?? '';
  localStorage.setItem(STORAGE_KEY, String(userId));
  return { userId, name };
}

async function resolveUserId(): Promise<{ userId: number; name: string }> {
  const fromWebApp = readWebAppUser();
  if (fromWebApp) {
    return fromWebApp;
  }

  const legacyBridge = window.MaxBridge;
  if (legacyBridge) {
    try {
      const info = await legacyBridge.getUserInfo();
      if (info.userId > 0) {
        localStorage.setItem(STORAGE_KEY, String(info.userId));
        return { userId: info.userId, name: info.name };
      }
    } catch {
      // fall through
    }
  }

  return { userId: resolveFallbackUserId(), name: '' };
}

export function useMaxBridge() {
  const [userId, setUserId] = useState(0);
  const [userName, setUserName] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void resolveUserId().then(({ userId: resolvedId, name }) => {
      if (cancelled) {
        return;
      }
      setUserId(resolvedId);
      setUserName(name);
      setIsReady(true);
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

  return { userId, userName, isReady, close, haptic };
}
