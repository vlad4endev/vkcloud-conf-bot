import type { Bot } from '@maxhub/max-bot-api';
import { prisma } from '../../db/client';
import {
  broadcastToAll,
  finalizeImmediateBroadcast,
  setBotInstance,
} from '../notifications';

export async function processPendingNotifications(bot: Bot): Promise<void> {
  setBotInstance(bot);

  const now = new Date();
  const pending = await prisma.notification.findMany({
    where: {
      isSent: false,
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
    },
    take: 50,
    orderBy: { createdAt: 'asc' },
  });

  for (const notification of pending) {
    const result = await broadcastToAll(notification.text);
    const success = await finalizeImmediateBroadcast(notification.id, result);
    if (!success) {
      console.error(
        `Notification ${notification.id}: delivery failed, will retry on next cron tick`,
      );
    }
  }
}
