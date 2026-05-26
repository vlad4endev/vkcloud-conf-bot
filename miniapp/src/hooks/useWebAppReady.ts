import { useLayoutEffect } from 'react';
import { notifyWebAppReady } from '../lib/webApp';

/**
 * MAX скрывает загрузчик после WebApp.ready().
 * Вызываем только после первого кадра React, иначе — белый экран.
 */
export function useWebAppReady(): void {
  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        notifyWebAppReady();
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);
}
