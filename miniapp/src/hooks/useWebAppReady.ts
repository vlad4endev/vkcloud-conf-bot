import { useEffect } from 'react';

/** Сообщает клиенту MAX, что UI готов — иначе часто белый экран. */
export function useWebAppReady(): void {
  useEffect(() => {
    let attempts = 0;

    const notify = (): boolean => {
      const ready = window.WebApp?.ready;
      if (typeof ready !== 'function') {
        return false;
      }
      try {
        ready();
      } catch (error) {
        console.error('WebApp.ready failed:', error);
      }
      return true;
    };

    if (notify()) {
      return;
    }

    const timer = window.setInterval(() => {
      attempts += 1;
      if (notify() || attempts >= 50) {
        window.clearInterval(timer);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, []);
}
