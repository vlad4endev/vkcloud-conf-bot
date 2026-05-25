import { useEffect } from 'react';

/**
 * Сообщает клиенту MAX, что мини-приложение готово к показу.
 * @see https://dev.max.ru/docs/webapps/bridge
 */
export function useWebAppReady(): void {
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50;

    const notify = () => {
      const webApp = window.WebApp;
      if (!webApp?.ready) {
        return false;
      }
      try {
        webApp.ready();
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
      if (notify() || attempts >= maxAttempts) {
        window.clearInterval(timer);
      }
    }, 100);

    return () => {
      window.clearInterval(timer);
    };
  }, []);
}
