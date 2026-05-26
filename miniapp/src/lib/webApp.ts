/** @see https://dev.max.ru/docs/webapps/bridge */

const STORAGE_ID_KEY = 'conf_user_id';
const STORAGE_NAME_KEY = 'conf_user_name';

export type WebAppUser = {
  userId: number;
  userName: string;
};

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

export function readWebAppUser(): WebAppUser | null {
  const user = window.WebApp?.initDataUnsafe?.user;
  const rawId = user?.id ?? user?.user_id;
  if (rawId == null || !Number.isInteger(rawId) || rawId <= 0) {
    return null;
  }

  const userName = user?.first_name ?? user?.name ?? '';
  safeStorageSet(STORAGE_ID_KEY, String(rawId));
  safeStorageSet(STORAGE_NAME_KEY, userName);

  return { userId: rawId, userName };
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
