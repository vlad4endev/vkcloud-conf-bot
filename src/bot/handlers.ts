import type { Context } from '@maxhub/max-bot-api';
import { prisma } from '../db/client';
import { sessions } from '../shared/types';
import { resolveBotUsername } from '../shared/maxMiniAppLink';
import { getMainMenuKeyboard } from './keyboards';
import { MESSAGES } from './messages';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
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

function parseUserData(text: string): { fullName: string; email: string } | null {
  const trimmed = text.trim();
  const emailMatches = [...trimmed.matchAll(EMAIL_REGEX)];

  if (emailMatches.length === 0) {
    return null;
  }

  const lastMatch = emailMatches[emailMatches.length - 1];
  const email = lastMatch[0];
  const emailIndex = lastMatch.index;

  if (emailIndex === undefined) {
    return null;
  }

  const afterEmail = trimmed.slice(emailIndex + email.length).trim();
  if (afterEmail.length > 0) {
    return null;
  }

  const fullName = trimmed.slice(0, emailIndex).trim().replace(/\s+/g, ' ');
  const words = fullName.split(/\s+/).filter(Boolean);

  if (words.length < 2) {
    return null;
  }

  return { fullName, email };
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

    sessions.set(userId, { state: 'waiting_data', createdAt: Date.now() });
    await ctx.reply(MESSAGES.WELCOME, { format: 'markdown' });
  } catch (error) {
    console.error('handleStart error:', error);
    sessions.set(userId, { state: 'waiting_data', createdAt: Date.now() });
    await ctx.reply(MESSAGES.WELCOME, { format: 'markdown' });
  }
}

export async function handleMessage(ctx: Context) {
  const userId = ctx.user?.user_id;
  const chatId = ctx.message?.recipient?.chat_id ?? ctx.chatId;
  if (!userId || chatId === undefined) {
    return;
  }

  // Webhook delivery may be retried; dedupe by messageId per user.
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
    // Для зарегистрированного пользователя не дублируем главное приветствие
    // на каждое текстовое сообщение: меню доступно по /start.
    return;
  }

  const text = (ctx.message?.body?.text ?? '').trim();

  // Пустые сообщения и команды (/start) не парсим — приветствие уже в handleStart
  if (!text || text.startsWith('/')) {
    return;
  }

  const parsed = parseUserData(text);

  if (!parsed) {
    return ctx.reply(MESSAGES.REGISTRATION_ERROR, { format: 'markdown' });
  }

  try {
    await prisma.user.upsert({
      where: { maxUserId: BigInt(userId) },
      update: {
        fullName: parsed.fullName,
        email: parsed.email,
        chatId: BigInt(chatId),
        isVerified: true,
      },
      create: {
        maxUserId: BigInt(userId),
        chatId: BigInt(chatId),
        fullName: parsed.fullName,
        email: parsed.email,
        isVerified: true,
      },
    });

    sessions.set(userId, { state: 'registered', createdAt: Date.now() });

    await ctx.reply(
      `✅ Спасибо, *${parsed.fullName}*! Вы зарегистрированы.`,
      { format: 'markdown' },
    );

    await sendMainMenu(ctx);
  } catch (e) {
    console.error('Ошибка сохранения пользователя:', e);
    await ctx.reply('Произошла ошибка. Попробуйте ещё раз.');
  }
}
