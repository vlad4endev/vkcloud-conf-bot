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

type HapticType = 'success' | 'error' | 'warning';

function readStoredUserId(): number {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return 0;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    return 0;
  }

  return value;
}

export function useMaxBridge() {
  const [userId, setUserId] = useState(0);
  const [userName, setUserName] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const bridge = window.MaxBridge;

    if (bridge) {
      bridge
        .getUserInfo()
        .then((info) => {
          setUserId(info.userId);
          setUserName(info.name);
          localStorage.setItem(STORAGE_KEY, String(info.userId));
        })
        .catch(() => {
          setUserId(readStoredUserId());
        })
        .finally(() => {
          setIsReady(true);
        });
      return;
    }

    setUserId(readStoredUserId());
    setIsReady(true);
  }, []);

  const close = useCallback(() => {
    window.MaxBridge?.close();
  }, []);

  const haptic = useCallback((type: HapticType) => {
    window.MaxBridge?.hapticFeedback(type);
  }, []);

  return { userId, userName, isReady, close, haptic };
}
