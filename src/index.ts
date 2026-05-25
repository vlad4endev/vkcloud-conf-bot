import 'dotenv/config';
import { Bot } from '@maxhub/max-bot-api';
import { handleStart, handleMessage } from './bot/handlers';
import { setBotInstance, startNotificationScheduler } from './bot/notifications';
import { setupWebhook } from './bot/webhook';
import { createWebhookServer } from './bot/webhookServer';
import { env } from './shared/env';
import { resolveBotUsername, resolveMaxMiniAppOpenUrl } from './shared/maxMiniAppLink';

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
    const botUsername = await resolveBotUsername(bot.api);
    const startappUrl = await resolveMaxMiniAppOpenUrl(bot.api);
    console.log(
      `[miniapp] bot="${bot.botInfo.name}" @${botUsername ?? '?'} startapp=${startappUrl ?? 'n/a'}`,
    );
    if (env.MINI_APP_URL) {
      console.log(
        `[miniapp] В панели MAX → «Чат-бот и мини-приложение» для @${botUsername}: ${env.MINI_APP_URL}`,
      );
    }
    await webhookServer.listen({ port, host: '0.0.0.0' });
    await setupWebhook(bot, process.env.WEBHOOK_URL + '/webhook');
  } else {
    await bot.start();
  }
}

main().catch((err) => {
  console.error('Failed to start bot:', err);
  process.exit(1);
});
