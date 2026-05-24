import type { Context } from '@maxhub/max-bot-api';
import type { User } from '@prisma/client';
import { prisma } from '../../db/client';

export async function ensureBotUser(ctx: Context): Promise<User | null> {
  const maxUser = ctx.user;
  const chatId = ctx.chatId;

  if (!maxUser || chatId === undefined) {
    return null;
  }

  return prisma.user.upsert({
    where: { maxUserId: BigInt(maxUser.user_id) },
    create: {
      maxUserId: BigInt(maxUser.user_id),
      chatId: BigInt(chatId),
      fullName: maxUser.name,
      email: '',
    },
    update: {
      chatId: BigInt(chatId),
      fullName: maxUser.name,
    },
  });
}
