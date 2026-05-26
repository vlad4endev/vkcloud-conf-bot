import { useLayoutEffect } from 'react';
import { notifyWebAppReady } from '../lib/webApp';

/** Сообщает клиенту MAX, что UI готов — иначе чёрный/белый экран до WebAppReady. */
export function useWebAppReady(): void {
  useLayoutEffect(() => {
    notifyWebAppReady();
  }, []);
}
