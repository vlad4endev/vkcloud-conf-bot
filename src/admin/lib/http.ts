import type { FastifyReply } from 'fastify';
import type { ZodError, ZodType } from 'zod';

export function getRouteId(params: { id?: string }): string | null {
  const id = params.id?.trim();
  return id ? id : null;
}

export function validationError(reply: FastifyReply, error: ZodError) {
  return reply.status(400).send({
    error: 'Validation failed',
    details: error.flatten(),
  });
}

export function parseBody<T>(schema: ZodType<T>, body: unknown) {
  return schema.safeParse(body);
}

export function notFound(reply: FastifyReply, entity = 'Resource') {
  return reply.status(404).send({ error: `${entity} not found` });
}
