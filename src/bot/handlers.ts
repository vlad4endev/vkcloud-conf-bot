import type { Context } from '@maxhub/max-bot-api';
import { prisma } from '../db/client';
import { sessions } from '../shared/types';
import { getMainMenuKeyboard } from './keyboards';
import { MESSAGES } from './messages';

const EMAIL_REGEX = /\S+@\S+\.\S+/;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const messageTimestamps = new Map<number, number[]>();

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
  const emailMatch = trimmed.match(EMAIL_REGEX);

  if (!emailMatch) {
    return null;
  }

  const email = emailMatch[0];
  if (!email.includes('@')) {
    return null;
  }

  const fullName = trimmed.replace(email, '').trim().replace(/\s+/g, ' ');
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

async function getMainMenuAttachment() {
  const miniAppUrl = process.env.MINI_APP_URL ?? '';
  const chatUrl = (await getConfig('chat_url')) ?? '';
  const stickerUrl = (await getConfig('sticker_url')) ?? '';

  return getMainMenuKeyboard(miniAppUrl, chatUrl, stickerUrl);
}

async function sendMainMenu(ctx: Context) {
  await ctx.reply(MESSAGES.ALREADY_REGISTERED, {
    format: 'markdown',
    attachments: [await getMainMenuAttachment()],
  });
}

export async function handleStart(ctx: Context) {
  const userId = ctx.user?.user_id;
  if (userId === undefined) {
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { maxUserId: BigInt(userId) },
    });

    if (user?.isVerified === true) {
      await sendMainMenu(ctx);
      return;
    }

    sessions.set(userId, { state: 'waiting_data', createdAt: Date.now() });
    const welcomeText = (await getConfig('bot_welcome')) ?? MESSAGES.WELCOME;
    await ctx.reply(welcomeText, { format: 'markdown' });
  } catch (error) {
    console.error('handleStart error:', error);
    await ctx.reply(MESSAGES.REGISTRATION_ERROR, { format: 'markdown' });
  }
}

export async function handleMessage(ctx: Context) {
  const text = ctx.message?.body.text?.trim();
  if (!text) {
    return;
  }

  const maxUser = ctx.user;
  if (!maxUser) {
    return;
  }

  if (isRateLimited(maxUser.user_id)) {
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { maxUserId: BigInt(maxUser.user_id) },
    });

    if (user?.isVerified) {
      await sendMainMenu(ctx);
      return;
    }

    const parsed = parseUserData(text);
    if (!parsed) {
      await ctx.reply(MESSAGES.REGISTRATION_ERROR, { format: 'markdown' });
      return;
    }

    const chatId = ctx.chatId;
    if (chatId === undefined) {
      return;
    }

    await prisma.user.upsert({
      where: { maxUserId: BigInt(maxUser.user_id) },
      create: {
        maxUserId: BigInt(maxUser.user_id),
        chatId: BigInt(chatId),
        fullName: parsed.fullName,
        email: parsed.email,
        isVerified: true,
      },
      update: {
        chatId: BigInt(chatId),
        fullName: parsed.fullName,
        email: parsed.email,
        isVerified: true,
      },
    });

    sessions.set(maxUser.user_id, {
      state: 'registered',
      createdAt: Date.now(),
    });

    await ctx.reply(MESSAGES.REGISTRATION_SUCCESS(parsed.fullName), {
      format: 'markdown',
      attachments: [await getMainMenuAttachment()],
    });
  } catch (error) {
    console.error('handleMessage error:', error);
    await ctx.reply(MESSAGES.REGISTRATION_ERROR, { format: 'markdown' });
  }
}
