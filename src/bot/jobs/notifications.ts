import type { Bot } from '@maxhub/max-bot-api';
import { processDueNotifications, setBotInstance } from '../notifications';

export async function processPendingNotifications(bot: Bot): Promise<void> {
  setBotInstance(bot);
  await processDueNotifications();
}
