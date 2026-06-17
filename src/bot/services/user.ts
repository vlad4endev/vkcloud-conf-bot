import type { Context } from '@maxhub/max-bot-api';
import type { User } from '@prisma/client';
import { prisma } from '../../db/client';
import { parseMaxProfileName } from '../../shared/maxProfileName';

function resolveChatId(ctx: Context): number | undefined {
  const chatId = ctx.chatId ?? ctx.message?.recipient?.chat_id;
  return chatId == null ? undefined : chatId;
}

/** Сохраняет пользователя, запустившего бота, до завершения регистрации. */
export async function trackUnregisteredBotUser(ctx: Context): Promise<User | null> {
  const maxUser = ctx.user;
  const chatId = resolveChatId(ctx);

  if (!maxUser || chatId === undefined) {
    return null;
  }

  const maxUserId = BigInt(maxUser.user_id);
  const displayName = maxUser.name?.trim() || 'Участник';
  const { firstName, lastName } = parseMaxProfileName(maxUser.name);

  return prisma.user.upsert({
    where: { maxUserId },
    create: {
      maxUserId,
      chatId: BigInt(chatId),
      fullName: displayName,
      email: '',
      profileFirstName: firstName,
      profileLastName: lastName,
      isVerified: false,
    },
    update: {
      chatId: BigInt(chatId),
      profileFirstName: firstName,
      profileLastName: lastName,
    },
  });
}

export async function ensureBotUser(ctx: Context): Promise<User | null> {
  return trackUnregisteredBotUser(ctx);
}
