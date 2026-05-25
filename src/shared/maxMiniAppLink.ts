import type { Api } from '@maxhub/max-bot-api';
import { env } from './env';

let cachedBotUsername: string | null = null;
let cachedOpenUrl: string | null = null;

/**
 * Диплинк MAX: открывает мини-приложение внутри клиента (не во внешнем браузере).
 * @see https://dev.max.ru/docs/webapps/introduction
 */
export function buildMaxStartAppUrl(botUsername: string, startParam?: string): string {
  const slug = botUsername.replace(/^@/, '').trim();
  const base = `https://max.ru/${slug}?startapp`;
  if (!startParam) {
    return base;
  }
  return `${base}=${encodeURIComponent(startParam)}`;
}

async function fetchBotUsernameFromApi(api: Api): Promise<string | null> {
  const info = await api.getMyInfo();
  const username = info.username?.replace(/^@/, '').trim();
  if (!username) {
    console.error(
      'API бота не вернул username — кнопка open_app не сработает. ' +
        'Проверьте токен и настройки бота в панели MAX.',
    );
    return null;
  }
  return username;
}

function warnEnvUsernameMismatch(envUsername: string, apiUsername: string): void {
  console.warn(
    `[miniapp] MAX_BOT_USERNAME=${envUsername} не совпадает с ботом токена (@${apiUsername}). ` +
      `open_app использует @${apiUsername}. В панели MAX привяжите MINI_APP_URL именно к этому боту.`,
  );
}

/**
 * Username бота из токена (приоритет) — для кнопки open_app поле web_app.
 * MAX_BOT_USERNAME в .env только запасной вариант без API.
 */
export async function resolveBotUsername(api?: Api): Promise<string | null> {
  if (cachedBotUsername) {
    return cachedBotUsername;
  }

  if (api) {
    const fromApi = await fetchBotUsernameFromApi(api);
    if (fromApi) {
      cachedBotUsername = fromApi;
      const fromEnv = env.MAX_BOT_USERNAME?.replace(/^@/, '').trim();
      if (fromEnv && fromEnv !== fromApi) {
        warnEnvUsernameMismatch(fromEnv, fromApi);
      }
      return fromApi;
    }
  }

  const fromEnv = env.MAX_BOT_USERNAME?.replace(/^@/, '').trim();
  if (!fromEnv) {
    console.error(
      'Username бота недоступен — укажите корректный BOT_TOKEN или MAX_BOT_USERNAME в .env',
    );
    return null;
  }

  cachedBotUsername = fromEnv;
  return fromEnv;
}

export async function resolveMaxMiniAppOpenUrl(api?: Api): Promise<string | null> {
  if (env.MAX_STARTAPP_URL) {
    return env.MAX_STARTAPP_URL;
  }

  if (cachedOpenUrl) {
    return cachedOpenUrl;
  }

  const username = await resolveBotUsername(api);
  if (!username) {
    return null;
  }

  cachedOpenUrl = buildMaxStartAppUrl(username);
  return cachedOpenUrl;
}

/** Сброс кэша (тесты) */
export function resetMaxMiniAppLinkCache(): void {
  cachedBotUsername = null;
  cachedOpenUrl = null;
}
