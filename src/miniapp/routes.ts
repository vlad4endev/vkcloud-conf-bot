import type { User } from '@prisma/client';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/client';
import {
  getRouteId,
  notFound,
  parseBody,
  validationError,
} from '../admin/lib/http';
import { env } from '../shared/env';
import type { AdminJwtPayload } from '../shared/jwt';
import {
  getCachedPublicConfig,
  getCachedQuizQuestionForAnswer,
  getCachedQuizQuestionsPublic,
  getCachedQuizVisibility,
} from '../shared/miniappCache';
import {
  parseMaxUserIdFromValidatedInitData,
  validateMaxUser,
} from '../shared/maxValidation';
import {
  API_REGISTRATION_REQUIRED,
  MINIAPP_REGISTRATION_MESSAGE,
} from '../shared/registrationMessages';
import { quizOptionSchema } from '../shared/schemas/admin';
import { getUserQuizStatus } from '../shared/quizStatus';
import {
  getQuizLiveState,
  subscribe,
} from '../shared/quizLiveBroadcaster';
import {
  PARTNERS_VISIBLE_CONFIG_KEY,
  isSectionVisible,
} from '../shared/sectionVisibility';
import {
  scheduleSessionInclude,
  serializeScheduleSessions,
} from '../shared/scheduleSession';
import { serializePartners } from '../shared/partner';
import {
  speakerWithSessionsInclude,
  serializeSpeaker,
  serializeSpeakers,
} from '../shared/speaker';

const MAX_INIT_DATA_HEADER = 'x-max-init-data';

type AuthenticatedRequest = FastifyRequest & {
  verifiedUser?: User;
};

function readMaxInitData(request: FastifyRequest): string | null {
  const raw = request.headers[MAX_INIT_DATA_HEADER];
  if (!raw) {
    return null;
  }

  const initData = Array.isArray(raw) ? raw[0] : raw;
  if (!initData || !validateMaxUser(initData)) {
    return null;
  }

  return initData;
}

function parseMaxUserIdFromRequestInitData(initData: string): number | null {
  return parseMaxUserIdFromValidatedInitData(initData);
}

async function requireMaxInitData(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!readMaxInitData(request)) {
    return reply.status(403).send({ error: 'MAX init data required' });
  }
}

async function attachVerifiedMaxUser(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<User | undefined> {
  const initData = readMaxInitData(request);
  if (!initData) {
    reply.status(403).send({ error: 'MAX init data required' });
    return undefined;
  }

  const maxUserId = parseMaxUserIdFromRequestInitData(initData);
  if (maxUserId === null) {
    reply.status(403).send({ error: 'Invalid MAX init data' });
    return undefined;
  }

  const user = await findUserByMaxUserId(maxUserId);
  if (!user?.isVerified) {
    reply.status(403).send({
      error: API_REGISTRATION_REQUIRED,
      message: MINIAPP_REGISTRATION_MESSAGE,
    });
    return undefined;
  }

  (request as AuthenticatedRequest).verifiedUser = user;
  return user;
}

/** Verified MAX user required (init data mandatory; same checks as middleware chain). */
async function requireRegisteredMaxUser(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = await attachVerifiedMaxUser(request, reply);
  if (!user) {
    return;
  }
}

const adminUnlockSchema = z.object({
  codeWord: z.string().trim().min(1),
});

const questionToSpeakerSchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
  question: z.coerce.string().trim().min(1, 'Укажите текст вопроса'),
});

const feedbackSchema = z.object({
  userId: z.number().int().positive().optional(),
  text: z.string().trim().min(5),
});

const quizAnswerSchema = z.object({
  userId: z.number().int().positive(),
  questionId: z.string().trim().min(1),
  answer: quizOptionSchema,
});

async function findUserByMaxUserId(maxUserId: number) {
  return prisma.user.findUnique({
    where: { maxUserId: BigInt(maxUserId) },
  });
}

function parseMaxUserId(raw: string | undefined): number | null {
  if (!raw?.trim()) {
    return null;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    return null;
  }
  return value;
}

export async function miniappRoutes(app: FastifyInstance): Promise<void> {
  app.get('/me', { preHandler: requireMaxInitData }, async (request, reply) => {
    const initData = readMaxInitData(request);
    if (!initData) {
      return reply.status(403).send({ error: 'MAX init data required' });
    }

    const maxUserId = parseMaxUserIdFromRequestInitData(initData);
    if (maxUserId === null) {
      return reply.status(403).send({ error: 'Invalid MAX init data' });
    }

    const user = await findUserByMaxUserId(maxUserId);

    return {
      maxUserId,
      isVerified: Boolean(user?.isVerified),
      fullName: user?.isVerified ? user.fullName : undefined,
    };
  });

  app.get('/config', async () => getCachedPublicConfig());

  app.get('/quiz/live', async () => getQuizLiveState());

  app.get('/quiz/events', async (request, reply) => {
    reply.hijack();
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    reply.raw.write(': connected\n\n');

    const unsubscribe = subscribe((chunk) => {
      reply.raw.write(chunk);
    });

    request.raw.on('close', () => {
      unsubscribe();
    });
  });

  app.get('/partners', async () => {
    const partners = await prisma.partner.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });

    if (partners.length === 0) {
      return [];
    }

    const visibilityRow = await prisma.config.findUnique({
      where: { key: PARTNERS_VISIBLE_CONFIG_KEY },
    });

    if (!isSectionVisible(visibilityRow?.value)) {
      return [];
    }

    return serializePartners(partners);
  });

  app.get(
    '/speakers',
    { preHandler: requireRegisteredMaxUser },
    async () => {
      const speakers = await prisma.speaker.findMany({
        include: speakerWithSessionsInclude,
        orderBy: { order: 'asc' },
      });

      return serializeSpeakers(speakers);
    },
  );

  app.get<{ Params: { id: string } }>(
    '/speakers/:id',
    { preHandler: requireRegisteredMaxUser },
    async (request, reply) => {
    const id = getRouteId(request.params);
    if (!id) {
      return notFound(reply, 'Speaker');
    }

    const speaker = await prisma.speaker.findUnique({
      where: { id },
      include: speakerWithSessionsInclude,
    });

    if (!speaker) {
      return notFound(reply, 'Speaker');
    }

    return serializeSpeaker(speaker);
  },
  );

  app.post<{ Params: { id: string } }>(
    '/speakers/:id/questions',
    { preHandler: requireRegisteredMaxUser },
    async (request, reply) => {
      const speakerId = getRouteId(request.params);
      if (!speakerId) {
        return notFound(reply, 'Speaker');
      }

      const body =
        typeof request.body === 'string'
          ? (() => {
              try {
                return JSON.parse(request.body) as unknown;
              } catch {
                return request.body;
              }
            })()
          : request.body;

      const parsed = parseBody(questionToSpeakerSchema, body);
      if (!parsed.success) {
        return validationError(reply, parsed.error);
      }

      const user = (request as AuthenticatedRequest).verifiedUser;
      if (!user) {
        return reply.status(403).send({ error: 'MAX init data required' });
      }

      const speaker = await prisma.speaker.findUnique({
        where: { id: speakerId },
        select: { id: true },
      });

      if (!speaker) {
        return notFound(reply, 'Speaker');
      }

      const record = await prisma.questionToSpeaker.create({
        data: {
          userId: user.id,
          speakerId,
          question: parsed.data.question,
        },
      });

      return reply.status(201).send({ id: record.id });
    },
  );

  app.get(
    '/schedule',
    { preHandler: requireRegisteredMaxUser },
    async () => {
      const sessions = await prisma.scheduleSession.findMany({
        orderBy: [{ order: 'asc' }, { startTime: 'asc' }],
        include: scheduleSessionInclude,
      });

      return serializeScheduleSessions(sessions);
    },
  );

  app.post(
    '/feedback',
    { preHandler: requireRegisteredMaxUser },
    async (request, reply) => {
    const parsed = parseBody(feedbackSchema, request.body);
    if (!parsed.success) {
      return validationError(reply, parsed.error);
    }

    let userId: string | undefined;
    if (parsed.data.userId !== undefined) {
      const user = await findUserByMaxUserId(parsed.data.userId);
      if (!user) {
        return notFound(reply, 'User');
      }
      userId = user.id;
    }

    const record = await prisma.feedback.create({
      data: {
        userId,
        text: parsed.data.text,
      },
    });

    return reply.status(201).send({ id: record.id });
    },
  );

  app.get(
    '/quiz/questions',
    { preHandler: requireRegisteredMaxUser },
    async () => {
      if (!(await getCachedQuizVisibility())) {
        return [];
      }

      return getCachedQuizQuestionsPublic();
    },
  );

  app.post(
    '/quiz/answer',
    { preHandler: requireRegisteredMaxUser },
    async (request, reply) => {
    const parsed = parseBody(quizAnswerSchema, request.body);
    if (!parsed.success) {
      return validationError(reply, parsed.error);
    }

    if (!(await getCachedQuizVisibility())) {
      return reply.status(403).send({ error: 'Quiz is not available' });
    }

    const verifiedUser = (request as AuthenticatedRequest).verifiedUser;
    if (!verifiedUser) {
      return reply.status(403).send({ error: 'MAX init data required' });
    }

    if (Number(verifiedUser.maxUserId) !== parsed.data.userId) {
      return reply.status(403).send({ error: 'User mismatch' });
    }

    const question = await getCachedQuizQuestionForAnswer(parsed.data.questionId);

    if (!question) {
      return notFound(reply, 'Question');
    }

    const isCorrect = parsed.data.answer === question.correctOption;

    await prisma.quizResult.upsert({
      where: {
        userId_questionId: {
          userId: verifiedUser.id,
          questionId: question.id,
        },
      },
      create: {
        userId: verifiedUser.id,
        questionId: question.id,
        answer: parsed.data.answer,
        isCorrect,
      },
      update: {
        answer: parsed.data.answer,
        isCorrect,
      },
    });

    return {
      isCorrect,
      correctOption: question.correctOption,
    };
    },
  );

  app.get<{ Params: { userId: string } }>(
    '/quiz/status/:userId',
    { preHandler: requireRegisteredMaxUser },
    async (request, reply) => {
      const maxUserId = parseMaxUserId(request.params.userId);
      if (maxUserId === null) {
        return reply.status(400).send({ error: 'Invalid userId' });
      }

      const verifiedUser = (request as AuthenticatedRequest).verifiedUser;
      if (!verifiedUser) {
        return reply.status(403).send({ error: 'MAX init data required' });
      }

      if (Number(verifiedUser.maxUserId) !== maxUserId) {
        return reply.status(403).send({ error: 'User mismatch' });
      }

      return getUserQuizStatus(verifiedUser.id);
    },
  );

  app.post(
    '/admin/unlock',
    { preHandler: requireMaxInitData },
    async (request, reply) => {
      const parsed = parseBody(adminUnlockSchema, request.body);
      if (!parsed.success) {
        return validationError(reply, parsed.error);
      }

      if (parsed.data.codeWord !== env.ADMIN_CODE_WORD) {
        return reply.status(401).send({ error: 'Invalid code word' });
      }

      const admin = await prisma.admin.findFirst({
        orderBy: { createdAt: 'asc' },
      });

      if (!admin) {
        return reply.status(503).send({ error: 'Admin account is not configured' });
      }

      const token = await request.server.jwt.sign({
        sub: admin.id,
        email: admin.email,
        role: 'admin',
      } satisfies AdminJwtPayload);

      return {
        token,
        admin: { id: admin.id, email: admin.email, name: admin.name },
      };
    },
  );
}
