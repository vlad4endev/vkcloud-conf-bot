import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
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

  await app.register(cors, {
    origin: true,
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

  await app.register(adminRoutes, { prefix: '/admin' });
  await app.register(miniappRoutes, { prefix: '/api' });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: error.flatten(),
      });
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
