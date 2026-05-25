import type { Api } from '@maxhub/max-bot-api';
import { env } from './env';

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

export async function resolveMaxMiniAppOpenUrl(api?: Api): Promise<string | null> {
  if (env.MAX_STARTAPP_URL) {
    return env.MAX_STARTAPP_URL;
  }

  if (cachedOpenUrl) {
    return cachedOpenUrl;
  }

  const username =
    env.MAX_BOT_USERNAME ??
    (api ? (await api.getMyInfo()).username : null) ??
    null;

  if (!username) {
    console.error(
      'MAX_BOT_USERNAME не задан и username бота недоступен — кнопка мини-приложения скрыта. ' +
        'Укажите MAX_BOT_USERNAME в .env (имя бота в MAX, как в ссылке max.ru/ИмяБота).',
    );
    return null;
  }

  cachedOpenUrl = buildMaxStartAppUrl(username);
  return cachedOpenUrl;
}

/** Имя бота для кнопки open_app (поле web_app) */
export async function resolveBotUsername(api?: Api): Promise<string | null> {
  const username =
    env.MAX_BOT_USERNAME ??
    (api ? (await api.getMyInfo()).username : null) ??
    null;

  if (!username) {
    console.error(
      'MAX_BOT_USERNAME не задан — укажите имя бота в .env (например id280106037423_bot)',
    );
    return null;
  }

  return username.replace(/^@/, '').trim();
}
