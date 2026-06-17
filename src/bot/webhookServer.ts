import type { Bot } from '@maxhub/max-bot-api';
import type { Update } from '@maxhub/max-bot-api/types';
import Fastify from 'fastify';
import { prisma } from '../db/client';
import { env } from '../shared/env';
import { deliverNotification } from './notifications';

interface BotInternal {
  handleUpdate(update: Update): Promise<void>;
}

export async function createWebhookServer(bot: Bot) {
  const app = Fastify({ logger: true });

  app.get('/health', async (_request, reply) => {
    return reply.status(200).send({ status: 'ok' });
  });

  app.post('/webhook', async (request, reply) => {
    const update = request.body as Update;
    await (bot as unknown as BotInternal).handleUpdate(update);
    return reply.status(200).send();
  });

  app.post<{ Params: { id: string } }>(
    '/internal/notifications/:id/deliver',
    async (request, reply) => {
      if (request.headers['x-notification-secret'] !== env.ADMIN_JWT_SECRET) {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const notification = await prisma.notification.findUnique({
        where: { id: request.params.id },
      });
      if (!notification) {
        return reply.status(404).send({ error: 'Notification not found' });
      }

      void deliverNotification(notification.id, notification.text)
        .then((success) => {
          request.log.info(
            { notificationId: notification.id, success },
            'Immediate broadcast finished',
          );
        })
        .catch((error) => {
          request.log.error(
            { err: error, notificationId: notification.id },
            'Immediate broadcast failed',
          );
        });

      return reply.status(202).send({ accepted: true });
    },
  );

  return app;
}
