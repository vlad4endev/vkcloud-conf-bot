/** @see https://dev.max.ru/docs/webapps/bridge */

const STORAGE_ID_KEY = 'conf_user_id';
const STORAGE_NAME_KEY = 'conf_user_name';

export type WebAppUser = {
  userId: number;
  userName: string;
};

const MAX_HASH_KEYS = ['WebAppData', 'WebAppPlatform', 'WebAppVersion'] as const;

/**
 * MAX кладёт init-параметры в location.hash (#WebAppData=…).
 * HashRouter воспринимает это как путь и не находит маршрут → белый экран.
 * SDK уже сохранил данные в sessionStorage — hash можно очистить.
 */
export function normalizeMaxLaunchUrl(): void {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw) {
    return;
  }

  const params = new URLSearchParams(raw);
  const hasMaxParams = MAX_HASH_KEYS.some((key) => params.has(key));
  if (!hasMaxParams) {
    return;
  }

  const { pathname, search } = window.location;
  window.history.replaceState(null, '', `${pathname}${search}`);
}

export function notifyWebAppReady(): void {
  try {
    window.WebApp?.ready?.();
  } catch (error) {
    console.error('[WebApp] ready failed:', error);
  }
}

function safeStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // WebView может блокировать storage
  }
}

function parseMaxUserId(rawId: unknown): number | null {
  if (typeof rawId === 'number' && Number.isInteger(rawId) && rawId > 0) {
    return rawId;
  }

  if (typeof rawId === 'string' && /^\d+$/.test(rawId)) {
    const parsed = Number.parseInt(rawId, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

export function readWebAppUser(): WebAppUser | null {
  const user = window.WebApp?.initDataUnsafe?.user;
  const userId = parseMaxUserId(user?.id ?? user?.user_id);
  if (userId === null) {
    return null;
  }

  const userName = user?.first_name ?? user?.name ?? '';
  safeStorageSet(STORAGE_ID_KEY, String(userId));
  safeStorageSet(STORAGE_NAME_KEY, userName);

  return { userId, userName };
}

export function readStoredUser(): WebAppUser | null {
  const savedId = safeStorageGet(STORAGE_ID_KEY);
  if (!savedId) {
    return null;
  }

  const parsedId = Number.parseInt(savedId, 10);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return null;
  }

  return {
    userId: parsedId,
    userName: safeStorageGet(STORAGE_NAME_KEY) ?? '',
  };
}

export function createDevUser(): WebAppUser {
  const devId = Math.floor(Math.random() * 900000) + 100000;
  safeStorageSet(STORAGE_ID_KEY, String(devId));
  return { userId: devId, userName: 'Гость' };
}

export function resolveInitialUser(): WebAppUser {
  return readWebAppUser() ?? readStoredUser() ?? createDevUser();
}
