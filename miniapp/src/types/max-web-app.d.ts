/** @see https://dev.max.ru/docs/webapps/bridge */
interface MaxWebAppUser {
  id?: number;
  user_id?: number;
  name?: string;
  first_name?: string;
}

interface MaxWebAppInitDataUnsafe {
  user?: MaxWebAppUser;
  start_param?: string;
}

interface MaxWebAppHapticFeedback {
  impactOccurred?: (type: 'success' | 'error' | 'warning') => void;
  notificationOccurred?: (
    type: 'success' | 'error' | 'warning',
  ) => Promise<unknown>;
}

interface MaxWebApp {
  initData?: string;
  initDataUnsafe?: MaxWebAppInitDataUnsafe;
  ready?: () => void;
  close?: () => void;
  HapticFeedback?: MaxWebAppHapticFeedback;
}

interface Window {
  WebApp?: MaxWebApp;
}
