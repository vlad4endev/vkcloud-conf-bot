import cron from 'node-cron';
import type { Bot } from '@maxhub/max-bot-api';
import { prisma } from '../db/client';

let botInstance: Bot | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function setBotInstance(bot: Bot): void {
  botInstance = bot;
}

export async function broadcastToAll(text: string): Promise<number> {
  if (!botInstance) {
    throw new Error('Bot instance is not set. Call setBotInstance() first.');
  }

  const users = await prisma.user.findMany({
    where: { isVerified: true },
    select: { chatId: true },
  });

  let sentCount = 0;

  for (const user of users) {
    try {
      await botInstance.api.sendMessageToChat(Number(user.chatId), text);
      sentCount += 1;
    } catch (error) {
      console.error(`Failed to send message to chat ${user.chatId}:`, error);
    }

    await sleep(50);
  }

  return sentCount;
}

export function startNotificationScheduler(): void {
  cron.schedule('* * * * *', () => {
    void (async () => {
      try {
        const now = new Date();
        const pending = await prisma.notification.findMany({
          where: {
            isSent: false,
            scheduledAt: { lte: now },
          },
          orderBy: { scheduledAt: 'asc' },
        });

        for (const notification of pending) {
          try {
            const sentCount = await broadcastToAll(notification.text);

            await prisma.notification.update({
              where: { id: notification.id },
              data: { isSent: true, sentAt: new Date() },
            });

            console.log(
              `Notification ${notification.id} sent to ${sentCount} verified users`,
            );
          } catch (error) {
            console.error(
              `Failed to process notification ${notification.id}:`,
              error,
            );
          }
        }
      } catch (error) {
        console.error('Notification scheduler error:', error);
      }
    })();
  });
}
