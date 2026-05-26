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
import { validateMaxUser } from '../shared/maxValidation';
import { quizOptionSchema } from '../shared/schemas/admin';

const MAX_INIT_DATA_HEADER = 'x-max-init-data';

async function maxInitDataPreHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const raw = request.headers[MAX_INIT_DATA_HEADER];
  if (!raw) {
    return;
  }

  const initData = Array.isArray(raw) ? raw[0] : raw;
  if (!initData || !validateMaxUser(initData)) {
    return reply.status(403).send({ error: 'Invalid MAX init data' });
  }
}

async function requireMaxInitData(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const raw = request.headers[MAX_INIT_DATA_HEADER];
  if (!raw) {
    return reply.status(403).send({ error: 'MAX init data required' });
  }

  const initData = Array.isArray(raw) ? raw[0] : raw;
  if (!initData || !validateMaxUser(initData)) {
    return reply.status(403).send({ error: 'Invalid MAX init data' });
  }
}

const adminUnlockSchema = z.object({
  codeWord: z.string().trim().min(1),
});

const CONFIG_KEYS = [
  'event_description',
  'chat_url',
  'sticker_url',
  'map_image_url',
  'quiz_url',
] as const;

const questionToSpeakerSchema = z.object({
  userId: z.number().int().positive(),
  question: z.string().trim().min(10),
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

const speakerSelect = {
  id: true,
  name: true,
  bio: true,
  photoUrl: true,
  order: true,
} as const;

const quizQuestionSelect = {
  id: true,
  question: true,
  optionA: true,
  optionB: true,
  optionC: true,
  optionD: true,
  order: true,
} as const;

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
  app.get('/config', async () => {
    const rows = await prisma.config.findMany();
    const config = Object.fromEntries(rows.map((row) => [row.key, row.value]));

    for (const key of CONFIG_KEYS) {
      if (!(key in config)) {
        config[key] = '';
      }
    }

    return config;
  });

  app.get('/speakers', async () => {
    return prisma.speaker.findMany({
      select: speakerSelect,
      orderBy: { order: 'asc' },
    });
  });

  app.get<{ Params: { id: string } }>('/speakers/:id', async (request, reply) => {
    const id = getRouteId(request.params);
    if (!id) {
      return notFound(reply, 'Speaker');
    }

    const speaker = await prisma.speaker.findUnique({
      where: { id },
      select: speakerSelect,
    });

    if (!speaker) {
      return notFound(reply, 'Speaker');
    }

    return speaker;
  });

  app.post<{ Params: { id: string } }>(
    '/speakers/:id/questions',
    { preHandler: maxInitDataPreHandler },
    async (request, reply) => {
      const speakerId = getRouteId(request.params);
      if (!speakerId) {
        return notFound(reply, 'Speaker');
      }

      const parsed = parseBody(questionToSpeakerSchema, request.body);
      if (!parsed.success) {
        return validationError(reply, parsed.error);
      }

      const [speaker, user] = await Promise.all([
        prisma.speaker.findUnique({ where: { id: speakerId }, select: { id: true } }),
        findUserByMaxUserId(parsed.data.userId),
      ]);

      if (!speaker) {
        return notFound(reply, 'Speaker');
      }

      if (!user) {
        return notFound(reply, 'User');
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

  app.get('/schedule', async () => {
    return prisma.scheduleSession.findMany({
      orderBy: { order: 'asc' },
      include: { speaker: { select: { name: true } } },
    });
  });

  app.post('/feedback', { preHandler: maxInitDataPreHandler }, async (request, reply) => {
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
  });

  app.get('/quiz/questions', async () => {
    return prisma.quizQuestion.findMany({
      select: quizQuestionSelect,
      orderBy: { order: 'asc' },
    });
  });

  app.post('/quiz/answer', { preHandler: maxInitDataPreHandler }, async (request, reply) => {
    const parsed = parseBody(quizAnswerSchema, request.body);
    if (!parsed.success) {
      return validationError(reply, parsed.error);
    }

    const [user, question] = await Promise.all([
      findUserByMaxUserId(parsed.data.userId),
      prisma.quizQuestion.findUnique({ where: { id: parsed.data.questionId } }),
    ]);

    if (!user) {
      return notFound(reply, 'User');
    }

    if (!question) {
      return notFound(reply, 'Question');
    }

    const isCorrect = parsed.data.answer === question.correctOption;

    await prisma.quizResult.upsert({
      where: {
        userId_questionId: {
          userId: user.id,
          questionId: question.id,
        },
      },
      create: {
        userId: user.id,
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
  });

  app.get<{ Params: { userId: string } }>(
    '/quiz/status/:userId',
    async (request, reply) => {
      const maxUserId = parseMaxUserId(request.params.userId);
      if (maxUserId === null) {
        return reply.status(400).send({ error: 'Invalid userId' });
      }

      const user = await findUserByMaxUserId(maxUserId);
      if (!user) {
        return notFound(reply, 'User');
      }

      const [totalQuestions, answeredQuestions, correctAnswers] =
        await Promise.all([
          prisma.quizQuestion.count(),
          prisma.quizResult.count({ where: { userId: user.id } }),
          prisma.quizResult.count({
            where: { userId: user.id, isCorrect: true },
          }),
        ]);

      return {
        totalQuestions,
        answeredQuestions,
        correctAnswers,
        isWinner: totalQuestions > 0 && correctAnswers === totalQuestions,
      };
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
