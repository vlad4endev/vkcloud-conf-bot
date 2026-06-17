import cron from 'node-cron';
import { Bot, type Bot as BotType } from '@maxhub/max-bot-api';
import { prisma } from '../db/client';
import { env } from '../shared/env';
import {
  BROADCAST_RECIPIENT_SELECT,
  BROADCAST_RECIPIENT_WHERE,
  type BroadcastRecipient,
} from './broadcastRecipients';

let botInstance: BotType | null = null;
let standaloneBot: BotType | null = null;
let schedulerRunning = false;

const BROADCAST_BATCH_SIZE = 100;
const NOTIFICATION_BATCH_SIZE = 10;
/** Retry immediate broadcasts if admin delivery failed. */
const STUCK_IMMEDIATE_MS = 2 * 60 * 1000;

export interface BroadcastResult {
  sentCount: number;
  failedCount: number;
  recipientCount: number;
  verifiedRecipients: number;
  unverifiedRecipients: number;
}

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

function bigintToApiId(value: bigint): number | null {
  const asNumber = Number(value);
  if (!Number.isSafeInteger(asNumber) || BigInt(asNumber) !== value) {
    console.error(`MAX id ${value.toString()} is outside JS safe integer range`);
    return null;
  }
  return asNumber;
}

async function sendBroadcastMessage(
  bot: BotType,
  user: Pick<BroadcastRecipient, 'maxUserId' | 'chatId'>,
  text: string,
): Promise<boolean> {
  const userId = bigintToApiId(user.maxUserId);
  if (userId !== null) {
    try {
      await bot.api.sendMessageToUser(userId, text);
      return true;
    } catch (error) {
      console.error(
        `sendMessageToUser failed for maxUserId ${user.maxUserId.toString()}:`,
        error,
      );
    }
  }

  const chatId = bigintToApiId(user.chatId);
  if (chatId !== null) {
    try {
      await bot.api.sendMessageToChat(chatId, text);
      return true;
    } catch (error) {
      console.error(
        `sendMessageToChat failed for chatId ${user.chatId.toString()}:`,
        error,
      );
    }
  }

  return false;
}

export async function broadcastToAll(text: string): Promise<BroadcastResult> {
  const bot = getBroadcastBot();

  let sentCount = 0;
  let failedCount = 0;
  let recipientCount = 0;
  let verifiedRecipients = 0;
  let unverifiedRecipients = 0;
  let offset = 0;

  for (;;) {
    const users = await prisma.user.findMany({
      where: BROADCAST_RECIPIENT_WHERE,
      select: BROADCAST_RECIPIENT_SELECT,
      take: BROADCAST_BATCH_SIZE,
      skip: offset,
      orderBy: { id: 'asc' },
    });

    if (users.length === 0) {
      break;
    }

    recipientCount += users.length;
    verifiedRecipients += users.filter((user) => user.isVerified).length;
    unverifiedRecipients += users.filter((user) => !user.isVerified).length;

    for (const user of users) {
      const delivered = await sendBroadcastMessage(bot, user, text);
      if (delivered) {
        sentCount += 1;
      } else {
        failedCount += 1;
      }

      await sleep(50);
    }

    if (users.length < BROADCAST_BATCH_SIZE) {
      break;
    }

    offset += BROADCAST_BATCH_SIZE;
  }

  console.info(
    `Broadcast finished: sent=${sentCount}, failed=${failedCount}, recipients=${recipientCount} (verified=${verifiedRecipients}, unregistered=${unverifiedRecipients})`,
  );

  return {
    sentCount,
    failedCount,
    recipientCount,
    verifiedRecipients,
    unverifiedRecipients,
  };
}

export async function countBroadcastRecipients(): Promise<{
  total: number;
  verified: number;
  unregistered: number;
}> {
  const [total, verified] = await Promise.all([
    prisma.user.count({ where: BROADCAST_RECIPIENT_WHERE }),
    prisma.user.count({ where: { isVerified: true } }),
  ]);

  return {
    total,
    verified,
    unregistered: total - verified,
  };
}

async function claimNotification(notificationId: string): Promise<boolean> {
  const claim = await prisma.notification.updateMany({
    where: { id: notificationId, isSent: false },
    data: { isSent: true, sentAt: new Date() },
  });

  return claim.count > 0;
}

async function releaseNotificationClaim(notificationId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { isSent: false, sentAt: null },
  });
}

/** Atomically claims and delivers a notification; safe to call from API and cron. */
export async function deliverNotification(
  notificationId: string,
  text: string,
): Promise<boolean> {
  const claimed = await claimNotification(notificationId);
  if (!claimed) {
    return false;
  }

  try {
    const result = await broadcastToAll(text);
    const success = await finalizeBroadcast(notificationId, result);
    if (!success) {
      await releaseNotificationClaim(notificationId);
    }
    return success;
  } catch (error) {
    await releaseNotificationClaim(notificationId);
    throw error;
  }
}

async function finalizeBroadcast(
  notificationId: string,
  result: BroadcastResult,
): Promise<boolean> {
  if (result.recipientCount === 0) {
    console.warn(
      `Notification ${notificationId}: no users in database, marking as sent`,
    );
    return true;
  }

  if (result.sentCount > 0) {
    return true;
  }

  console.error(
    `Notification ${notificationId}: 0/${result.recipientCount} messages delivered`,
  );
  return false;
}

export async function processDueNotifications(): Promise<void> {
  const now = new Date();
  const stuckImmediateBefore = new Date(now.getTime() - STUCK_IMMEDIATE_MS);

  const pending = await prisma.notification.findMany({
    where: {
      isSent: false,
      OR: [
        { scheduledAt: { not: null, lte: now } },
        {
          scheduledAt: null,
          createdAt: { lte: stuckImmediateBefore },
        },
      ],
    },
    take: NOTIFICATION_BATCH_SIZE,
    orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }],
  });

  for (const notification of pending) {
    try {
      const success = await deliverNotification(notification.id, notification.text);
      if (!success) {
        console.warn(
          `Notification ${notification.id}: skipped or no messages delivered, will retry`,
        );
      }
    } catch (error) {
      console.error(
        `Failed to process notification ${notification.id}, will retry:`,
        error,
      );
    }
  }
}

export function startNotificationScheduler(): void {
  cron.schedule('* * * * *', () => {
    if (schedulerRunning) {
      return;
    }

    schedulerRunning = true;
    void processDueNotifications()
      .catch((error) => {
        console.error('Notification scheduler error:', error);
      })
      .finally(() => {
        schedulerRunning = false;
      });
  });
}
