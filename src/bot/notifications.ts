import cron from 'node-cron';
import { Bot, type Bot as BotType } from '@maxhub/max-bot-api';
import { prisma } from '../db/client';
import { env } from '../shared/env';

let botInstance: BotType | null = null;
let standaloneBot: BotType | null = null;

const BROADCAST_BATCH_SIZE = 100;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function setBotInstance(bot: BotType): void {
  botInstance = bot;
}

function getBroadcastBot(): BotType {
  if (botInstance) {
    return botInstance;
  }

  if (!standaloneBot) {
    standaloneBot = new Bot(env.BOT_TOKEN);
  }

  return standaloneBot;
}

export async function broadcastToAll(text: string): Promise<number> {
  const bot = getBroadcastBot();

  let sentCount = 0;
  let offset = 0;

  for (;;) {
    const users = await prisma.user.findMany({
      where: { isVerified: true },
      select: { chatId: true },
      take: BROADCAST_BATCH_SIZE,
      skip: offset,
      orderBy: { id: 'asc' },
    });

    if (users.length === 0) {
      break;
    }

    for (const user of users) {
      try {
        await bot.api.sendMessageToChat(Number(user.chatId), text);
        sentCount += 1;
      } catch (error) {
        console.error(`Failed to send message to chat ${user.chatId}:`, error);
      }

      await sleep(50);
    }

    if (users.length < BROADCAST_BATCH_SIZE) {
      break;
    }

    offset += BROADCAST_BATCH_SIZE;
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
            await broadcastToAll(notification.text);

            await prisma.notification.update({
              where: { id: notification.id },
              data: { isSent: true, sentAt: new Date() },
            });
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
