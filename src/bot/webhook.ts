import type { Bot } from '@maxhub/max-bot-api';
import { env } from '../shared/env';

const SUBSCRIPTIONS_URL = 'https://platform-api.max.ru/subscriptions';

export async function setupWebhook(bot: Bot, webhookUrl: string): Promise<void> {
  try {
    const response = await fetch(SUBSCRIPTIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: env.BOT_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        update_types: ['bot_started', 'message_created', 'message_callback'],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Webhook subscription failed (${response.status}):`, body);
      return;
    }

    console.log(`Webhook subscription registered: ${webhookUrl}`);
  } catch (error) {
    console.error('Webhook subscription error:', error);
  }
}
