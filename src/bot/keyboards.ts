import { Keyboard } from '@maxhub/max-bot-api';
import { BUTTONS } from './messages';

/** @param miniAppOpenUrl диплинк max.ru/ИмяБота?startapp — открывает mini app внутри MAX */
export function getMainMenuKeyboard(
  miniAppOpenUrl: string,
  chatUrl: string,
  stickerUrl: string
): ReturnType<typeof Keyboard.inlineKeyboard> | null {
  const rows: ReturnType<typeof Keyboard.button.link>[][] = [];

  if (chatUrl && chatUrl.startsWith('https://')) {
    rows.push([Keyboard.button.link(BUTTONS.CHAT, chatUrl)]);
  }
  if (stickerUrl && stickerUrl.startsWith('https://')) {
    rows.push([Keyboard.button.link(BUTTONS.STICKER_PACK, stickerUrl)]);
  }
  if (miniAppOpenUrl && miniAppOpenUrl.startsWith('https://')) {
    rows.push([Keyboard.button.link(BUTTONS.OPEN_APP, miniAppOpenUrl)]);
  }

  if (rows.length === 0) return null;

  return Keyboard.inlineKeyboard(rows);
}
