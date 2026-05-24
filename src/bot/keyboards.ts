import { Keyboard } from '@maxhub/max-bot-api';
import { BUTTONS } from './messages';

type OpenAppButton = {
  type: 'open_app';
  text: string;
  web_app?: string;
  contact_id?: number;
};

type ButtonApi = typeof Keyboard.button & {
  openApp: (
    text: string,
    webApp?: string,
    contactId?: number,
  ) => OpenAppButton;
};

const buttonApi = Keyboard.button as ButtonApi;

if (!buttonApi.openApp) {
  buttonApi.openApp = (text, webApp, contactId) => ({
    type: 'open_app',
    text,
    ...(webApp !== undefined ? { web_app: webApp } : {}),
    ...(contactId !== undefined ? { contact_id: contactId } : {}),
  });
}

export function getMainMenuKeyboard(
  miniAppUrl: string,
  chatUrl: string,
  stickerUrl: string,
): ReturnType<typeof Keyboard.inlineKeyboard> {
  return Keyboard.inlineKeyboard([
    [(Keyboard.button as ButtonApi).openApp(BUTTONS.OPEN_APP, miniAppUrl) as never],
    [
      Keyboard.button.link(BUTTONS.CHAT, chatUrl),
      Keyboard.button.link(BUTTONS.STICKER_PACK, stickerUrl),
    ],
  ]);
}
