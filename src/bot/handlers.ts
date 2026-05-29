import type { Context } from '@maxhub/max-bot-api';
import { prisma } from '../db/client';
import { sessions } from '../shared/types';
import { resolveBotUsername } from '../shared/maxMiniAppLink';
import { getMainMenuKeyboard } from './keyboards';
import { MESSAGES } from './messages';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const EMAIL_IN_TEXT_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const messageTimestamps = new Map<number, number[]>();
const lastProcessedMessageIdByUser = new Map<number, string>();
/** MAX часто шлёт bot_started и /start подряд — не дублируем меню/приветствие. */
const lastStartHandledAtByUser = new Map<number, number>();
const START_HANDLER_COOLDOWN_MS = 5_000;

function shouldHandleStart(userId: number): boolean {
  const now = Date.now();
  const last = lastStartHandledAtByUser.get(userId) ?? 0;
  if (now - last < START_HANDLER_COOLDOWN_MS) {
    return false;
  }
  lastStartHandledAtByUser.set(userId, now);
  return true;
}

function isRateLimited(userId: number): boolean {
  const now = Date.now();
  const recent = (messageTimestamps.get(userId) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (recent.length >= RATE_LIMIT_MAX) {
    return true;
  }

  recent.push(now);
  messageTimestamps.set(userId, recent);
  return false;
}

function validateFullName(text: string): string | null {
  const trimmed = text.trim().replace(/\s+/g, ' ');

  if (EMAIL_IN_TEXT_REGEX.test(trimmed)) {
    return null;
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 2) {
    return null;
  }

  return trimmed;
}

function validateEmail(text: string): string | null {
  const trimmed = text.trim();
  if (!EMAIL_REGEX.test(trimmed)) {
    return null;
  }
  return trimmed;
}

async function getConfig(key: string): Promise<string | null> {
  try {
    const config = await prisma.config.findUnique({ where: { key } });
    return config?.value ?? null;
  } catch (error) {
    console.error(`Failed to load config key ${key}:`, error);
    return null;
  }
}

async function sendMainMenu(ctx: Context) {
  const miniAppBotUsername = await resolveBotUsername(ctx.api);
  const chatUrl = (await getConfig('chat_url')) ?? '';
  const stickerUrl = (await getConfig('sticker_url')) ?? '';

  const keyboard = getMainMenuKeyboard(miniAppBotUsername, chatUrl, stickerUrl);

  if (keyboard) {
    await ctx.reply(MESSAGES.MAIN_MENU, { attachments: [keyboard] });
  } else {
    await ctx.reply(MESSAGES.MAIN_MENU);
  }

  const userId = ctx.user?.user_id;
  if (userId) {
    lastStartHandledAtByUser.set(userId, Date.now());
  }
}

async function completeRegistration(
  ctx: Context,
  userId: number,
  chatId: number,
  fullName: string,
  email: string,
) {
  await prisma.user.upsert({
    where: { maxUserId: BigInt(userId) },
    update: {
      fullName,
      email,
      chatId: BigInt(chatId),
      isVerified: true,
    },
    create: {
      maxUserId: BigInt(userId),
      chatId: BigInt(chatId),
      fullName,
      email,
      isVerified: true,
    },
  });

  sessions.set(userId, { state: 'registered', createdAt: Date.now() });

  await ctx.reply(`✅ Спасибо, *${fullName}*! Вы зарегистрированы.`, {
    format: 'markdown',
  });

  await sendMainMenu(ctx);
}

export async function handleStart(ctx: Context) {
  const userId = ctx.user?.user_id;
  if (!userId) {
    return;
  }

  if (!shouldHandleStart(userId)) {
    return;
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { maxUserId: BigInt(userId) },
    });

    if (existing?.isVerified) {
      return sendMainMenu(ctx);
    }

    sessions.set(userId, { state: 'waiting_name', createdAt: Date.now() });
    await ctx.reply(MESSAGES.WELCOME, { format: 'markdown' });
  } catch (error) {
    console.error('handleStart error:', error);
    sessions.set(userId, { state: 'waiting_name', createdAt: Date.now() });
    await ctx.reply(MESSAGES.WELCOME, { format: 'markdown' });
  }
}

export async function handleMessage(ctx: Context) {
  const userId = ctx.user?.user_id;
  const chatId = ctx.message?.recipient?.chat_id ?? ctx.chatId;
  if (!userId || chatId === undefined) {
    return;
  }

  const messageId = ctx.messageId;
  if (messageId) {
    const last = lastProcessedMessageIdByUser.get(userId);
    if (last === messageId) {
      return;
    }
    lastProcessedMessageIdByUser.set(userId, messageId);
  }

  if (isRateLimited(userId)) {
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { maxUserId: BigInt(userId) },
  });

  if (existing?.isVerified) {
    return;
  }

  const text = (ctx.message?.body?.text ?? '').trim();

  if (!text || text.startsWith('/')) {
    return;
  }

  let session = sessions.get(userId);
  if (!session || session.state === 'registered') {
    session = { state: 'waiting_name', createdAt: Date.now() };
    sessions.set(userId, session);
  }

  if (session.state === 'waiting_name') {
    const fullName = validateFullName(text);
    if (!fullName) {
      return ctx.reply(MESSAGES.NAME_ERROR, { format: 'markdown' });
    }

    sessions.set(userId, {
      state: 'waiting_email',
      fullName,
      createdAt: Date.now(),
    });
    return ctx.reply(MESSAGES.ASK_EMAIL, { format: 'markdown' });
  }

  if (session.state === 'waiting_email') {
    const email = validateEmail(text);
    if (!email || !session.fullName) {
      return ctx.reply(MESSAGES.EMAIL_ERROR, { format: 'markdown' });
    }

    try {
      await completeRegistration(ctx, userId, chatId, session.fullName, email);
    } catch (e) {
      console.error('Ошибка сохранения пользователя:', e);
      await ctx.reply('Произошла ошибка. Попробуйте ещё раз.');
    }
  }
}
