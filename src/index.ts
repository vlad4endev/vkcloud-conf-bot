import 'dotenv/config';
import { Bot } from '@maxhub/max-bot-api';
import { handleStart, handleMessage } from './bot/handlers';
import { setBotInstance, startNotificationScheduler } from './bot/notifications';
import { setupWebhook } from './bot/webhook';
import { createWebhookServer } from './bot/webhookServer';

const botToken = process.env.BOT_TOKEN;

if (!botToken) {
  console.error('BOT_TOKEN is not set');
  process.exit(1);
}

const bot = new Bot(botToken);
setBotInstance(bot);

bot.on('bot_started', handleStart);
bot.command('start', handleStart);
bot.on('message_created', handleMessage);

async function main(): Promise<void> {
  startNotificationScheduler();

  if (process.env.NODE_ENV === 'production' && process.env.WEBHOOK_URL) {
    const webhookServer = await createWebhookServer(bot);
    const port = Number(process.env.PORT ?? 3000);
    bot.botInfo ??= await bot.api.getMyInfo();
    await webhookServer.listen({ port, host: '0.0.0.0' });
    await setupWebhook(bot, process.env.WEBHOOK_URL + '/webhook');
    console.log('Bot webhook server started');
  } else {
    await bot.start();
    console.log('Bot started successfully');
  }
}

main().catch((err) => {
  console.error('Failed to start bot:', err);
  process.exit(1);
});
