import cron from 'node-cron';
import { prisma } from '../db/client';
import { env } from '../shared/env';
import { createBot } from './app';
import { processPendingNotifications } from './jobs/notifications';
import { setupWebhook } from './webhook';
import { createWebhookServer } from './webhookServer';

async function main(): Promise<void> {
  const bot = createBot();

  cron.schedule('* * * * *', () => {
    void processPendingNotifications(bot).catch((err) => {
      console.error('Notification cron error:', err);
    });
  });

  const shutdown = () => {
    console.log('Shutting down bot...');
    bot.stop();
    void prisma.$disconnect().finally(() => process.exit(0));
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  console.log('Starting VK Cloud Conf 2026 bot...');

  if (env.NODE_ENV === 'production' && process.env.WEBHOOK_URL) {
    const webhookServer = await createWebhookServer(bot);
    bot.botInfo ??= await bot.api.getMyInfo();
    await webhookServer.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`Webhook server listening on http://0.0.0.0:${env.PORT}`);
    await setupWebhook(bot, process.env.WEBHOOK_URL + '/webhook');
  } else {
    await bot.start();
  }
}

main().catch((err) => {
  console.error('Fatal bot error:', err);
  process.exit(1);
});
