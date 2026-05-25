import { Keyboard } from '@maxhub/max-bot-api';
import { BUTTONS } from './messages';

/** open_app — запуск mini app внутри MAX (не внешняя ссылка) */
export type OpenAppInlineButton = {
  type: 'open_app';
  text: string;
  web_app: string;
};

export function openAppButton(text: string, botUsername: string): OpenAppInlineButton {
  return {
    type: 'open_app',
    text,
    web_app: botUsername.replace(/^@/, '').trim(),
  };
}

export function getMainMenuKeyboard(
  miniAppBotUsername: string | null,
  chatUrl: string,
  stickerUrl: string
): ReturnType<typeof Keyboard.inlineKeyboard> | null {
  const rows: (OpenAppInlineButton | ReturnType<typeof Keyboard.button.link>)[][] =
    [];

  if (chatUrl && chatUrl.startsWith('https://')) {
    rows.push([Keyboard.button.link(BUTTONS.CHAT, chatUrl)]);
  }
  if (stickerUrl && stickerUrl.startsWith('https://')) {
    rows.push([Keyboard.button.link(BUTTONS.STICKER_PACK, stickerUrl)]);
  }
  if (miniAppBotUsername) {
    rows.push([openAppButton(BUTTONS.OPEN_APP, miniAppBotUsername)]);
  }

  if (rows.length === 0) return null;

  return Keyboard.inlineKeyboard(
    rows as unknown as Parameters<typeof Keyboard.inlineKeyboard>[0],
  );
}
