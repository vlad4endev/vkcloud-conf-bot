import type { Bot } from '@maxhub/max-bot-api';
import type { Update } from '@maxhub/max-bot-api/types';
import Fastify from 'fastify';

interface BotInternal {
  handleUpdate(update: Update): Promise<void>;
}

export async function createWebhookServer(bot: Bot) {
  const app = Fastify({ logger: true });

  app.post('/webhook', async (request, reply) => {
    const update = request.body as Update;
    await (bot as unknown as BotInternal).handleUpdate(update);
    return reply.status(200).send();
  });

  return app;
}
