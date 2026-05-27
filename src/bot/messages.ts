import { env } from '../shared/env';

function buildWelcomeMessage(): string {
  const supportContact = env.SUPPORT_CONTACT?.trim() ?? '';

  return `**Добро пожаловать в бот конференции VK Cloud Conf 2026!**

Официальный бот мероприятия: здесь собрана информация о конференции и сервисы для участников.

Через бота вы можете:
• посмотреть программу конференции
• узнать о спикерах
• открыть карту площадки
• пройти квиз

Контакт для связи: ${supportContact}

Продолжая использование бота, вы соглашаетесь с документом об обработке персональных данных:
https://cloud.vk.com/docs/ru/start/legal/digital-cloud/events-terms

Для получения доступа к приложению конференции отправьте своё ФИО и корпоративную почту, использованную при регистрации, в формате:
Иванов Иван Иванович mail@mail.ru`;
}

export const MESSAGES = {
  WELCOME: buildWelcomeMessage(),

  MAIN_MENU: '🎉 Добро пожаловать на VK Cloud Conf 2026!',

  ALREADY_REGISTERED: 'Вы уже зарегистрированы! Используйте кнопки ниже:',

  REGISTRATION_SUCCESS: (name: string) =>
    `🎉 **${name}**, регистрация прошла успешно!

Добро пожаловать на VK Cloud Conf. Используйте кнопки ниже, чтобы открыть приложение, чат и стикерпак.`,

  REGISTRATION_ERROR: `Не удалось распознать данные.

Отправьте сообщение в формате:
Иванов Иван Иванович mail@mail.ru`,
} as const;

export const BUTTONS = {
  OPEN_APP: '🚀 Приложение конференции',
  CHAT: '💬 Чат участников',
  STICKER_PACK: '🎨 Стикерпак',
} as const;
