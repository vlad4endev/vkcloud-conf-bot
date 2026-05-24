import type { Bot } from '@maxhub/max-bot-api';
import { prisma } from '../../db/client';

export async function processPendingNotifications(bot: Bot): Promise<void> {
  const now = new Date();
  const pending = await prisma.notification.findMany({
    where: {
      isSent: false,
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
    },
    take: 50,
    orderBy: { createdAt: 'asc' },
  });

  if (pending.length === 0) {
    return;
  }

  const users = await prisma.user.findMany({
    select: { chatId: true },
  });

  for (const notification of pending) {
    for (const user of users) {
      try {
        await bot.api.sendMessageToChat(Number(user.chatId), notification.text);
      } catch (error) {
        console.error(
          `Failed to send notification ${notification.id} to chat ${user.chatId}:`,
          error,
        );
      }
    }

    await prisma.notification.update({
      where: { id: notification.id },
      data: { isSent: true, sentAt: new Date() },
    });
  }
}
