import type { Prisma } from '@prisma/client';

/** Все получатели рассылки: зарегистрированные и запустившие бота без регистрации. */
export const BROADCAST_RECIPIENT_WHERE: Prisma.UserWhereInput = {
  OR: [{ isVerified: true }, { isVerified: false }],
};

export const BROADCAST_RECIPIENT_SELECT = {
  maxUserId: true,
  chatId: true,
  isVerified: true,
} as const;

export type BroadcastRecipient = {
  maxUserId: bigint;
  chatId: bigint;
  isVerified: boolean;
};
