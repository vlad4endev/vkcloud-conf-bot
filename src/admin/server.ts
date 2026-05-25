import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import path from 'path';
import { ZodError } from 'zod';
import { env } from '../shared/env';
import '../shared/jwt';
import { miniappRoutes } from '../miniapp/routes';
import { adminRoutes } from './routes';

export async function createAdminServer() {
  const app = Fastify({
    logger: true,
  });

  app.addHook('preSerialization', async (_request, _reply, payload) => {
    return JSON.parse(
      JSON.stringify(payload, (_key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    ) as typeof payload;
  });

  await app.register(helmet, {
    contentSecurityPolicy: false, // управляем через nginx
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    frameguard: false, // без X-Frame-Options — miniapp в iframe MAX
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(cors, {
    origin: false, // CORS в nginx, не дублируем заголовки в Fastify
  });

  await app.register(jwt, {
    secret: env.ADMIN_JWT_SECRET,
  });

  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  await app.register(fastifyStatic, {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
  });

  app.get('/health', async (_request, reply) => {
    return reply.status(200).send({ status: 'ok' });
  });

  await app.register(adminRoutes, { prefix: '/admin' });
  await app.register(miniappRoutes, { prefix: '/api' });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: error.flatten(),
      });
    }

    if (error instanceof Error && error.message.includes('Invalid file')) {
      return reply.status(400).send({ error: error.message });
    }

    app.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  });

  return app;
}

if (require.main === module) {
  void (async () => {
    const app = await createAdminServer();
    const port = env.ADMIN_PORT;

    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`Admin API listening on http://0.0.0.0:${port}`);
  })().catch((error) => {
    console.error('Fatal admin error:', error);
    process.exit(1);
  });
}
