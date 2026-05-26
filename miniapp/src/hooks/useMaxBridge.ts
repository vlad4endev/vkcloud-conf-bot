import { useCallback, useEffect, useState } from 'react';

const STORAGE_ID_KEY = 'conf_user_id';
const STORAGE_NAME_KEY = 'conf_user_name';
const BRIDGE_TIMEOUT_MS = 3000;

interface MaxBridgeState {
  userId: number;
  userName: string;
  isReady: boolean;
}

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

export function useMaxBridge(): MaxBridgeState & {
  haptic: (type: HapticType) => void;
  close: () => void;
} {
  const [state, setState] = useState<MaxBridgeState>({
    userId: 0,
    userName: '',
    isReady: false,
  });

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const savedId = safeStorageGet(STORAGE_ID_KEY);
      const savedName = safeStorageGet(STORAGE_NAME_KEY);

      if (savedId) {
        const parsedId = Number.parseInt(savedId, 10);
        if (!cancelled && Number.isInteger(parsedId) && parsedId > 0) {
          setState({
            userId: parsedId,
            userName: savedName ?? '',
            isReady: true,
          });
        }
      }

      try {
        const bridge = window.MaxBridge;
        if (bridge?.getUserInfo) {
          const timeoutPromise = new Promise<never>((_, reject) => {
            window.setTimeout(() => reject(new Error('timeout')), BRIDGE_TIMEOUT_MS);
          });

          const userInfo = await Promise.race([
            bridge.getUserInfo(),
            timeoutPromise,
          ]);

          if (cancelled) {
            return;
          }

          safeStorageSet(STORAGE_ID_KEY, String(userInfo.userId));
          safeStorageSet(STORAGE_NAME_KEY, userInfo.name ?? '');

          setState({
            userId: userInfo.userId,
            userName: userInfo.name ?? '',
            isReady: true,
          });
          return;
        }
      } catch (error) {
        console.warn('MaxBridge getUserInfo failed:', error);
      }

      if (cancelled) {
        return;
      }

      if (!savedId) {
        const devId = Math.floor(Math.random() * 900000) + 100000;
        safeStorageSet(STORAGE_ID_KEY, String(devId));
        setState({
          userId: devId,
          userName: 'Гость',
          isReady: true,
        });
      } else {
        setState((prev) => ({ ...prev, isReady: true }));
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, []);

  const haptic = useCallback((type: HapticType) => {
    try {
      window.MaxBridge?.hapticFeedback?.(type);
    } catch {
      // ignore
    }
  }, []);

  const close = useCallback(() => {
    try {
      window.MaxBridge?.close?.();
    } catch {
      // ignore
    }
  }, []);

  return { ...state, haptic, close };
}
