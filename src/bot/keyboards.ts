import { Keyboard } from '@maxhub/max-bot-api';

export type OpenAppButton = {
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

export function openAppButton(text: string, webApp: string): OpenAppButton {
  return buttonApi.openApp(text, webApp);
}
