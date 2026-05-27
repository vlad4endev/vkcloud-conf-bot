import bcrypt from 'bcryptjs';
import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { broadcastToAll } from '../bot/notifications';
import { prisma } from '../db/client';
import { env } from '../shared/env';
import type { AdminJwtPayload } from '../shared/jwt';
import {
  quizQuestionCreateSchema,
  scheduleCreateSchema,
  scheduleReorderSchema,
  scheduleUpdateSchema,
  speakerCreateSchema,
  speakerReorderSchema,
  speakerUpdateSchema,
} from '../shared/schemas/admin';
import {
  buildSessionSpeakersCreate,
  getNextScheduleSessionOrder,
  resolveSessionSpeakerIds,
  scheduleSessionInclude,
  serializeScheduleSession,
  serializeScheduleSessions,
} from '../shared/scheduleSession';
import {
  formatScheduleTime,
  scheduleTimeToDate,
  scheduleTimeToMinutes,
} from '../shared/scheduleTime';
import { saveUploadedFile } from '../shared/upload';
import { getRouteId, notFound, parseBody, validationError } from './lib/http';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  codeWord: z.string().min(1),
});

const usersQuerySchema = z.object({
  search: z.string().trim().optional(),
});

const userUpdateSchema = z
  .object({
    fullName: z.string().trim().min(2).max(200).optional(),
    email: z.string().email().optional(),
    isVerified: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field is required',
  });

const notificationSchema = z.object({
  text: z.string().trim().min(1),
  scheduledAt: z.coerce.date().optional(),
});

const notificationsQuerySchema = z.object({
  status: z.enum(['pending', 'sent']).optional(),
});

const notificationUpdateSchema = z
  .object({
    text: z.string().trim().min(1).optional(),
    scheduledAt: z.coerce.date().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field is required',
  });

const configUpdateSchema = z.object({
  value: z.string(),
});

const configKeySchema = z.object({
  key: z.string().trim().min(1),
});

const urlSchema = z.string().url();

const linksUpdateSchema = z
  .object({
    chatUrl: urlSchema.optional(),
    stickerUrl: urlSchema.optional(),
    quizUrl: urlSchema.optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field is required',
  });

const textsUpdateSchema = z
  .object({
    eventDescription: z.string().min(10).optional(),
    botWelcome: z.string().min(10).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field is required',
  });

const LINK_CONFIG_KEYS = {
  chatUrl: 'chat_url',
  stickerUrl: 'sticker_url',
  quizUrl: 'quiz_url',
  mapImageUrl: 'map_image_url',
} as const;

const TEXT_CONFIG_KEYS = {
  eventDescription: 'event_description',
  botWelcome: 'bot_welcome',
} as const;

const quizQuestionUpdateSchema = quizQuestionCreateSchema;

const speakerWithSessionsCountInclude = {
  _count: { select: { sessionSpeakers: true } },
} as const;

async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ error: 'Unauthorized' });
  }
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function getConfigMap(
  keys: readonly string[],
): Promise<Map<string, string>> {
  const configs = await prisma.config.findMany({
    where: { key: { in: [...keys] } },
  });

  return new Map(configs.map((config) => [config.key, config.value]));
}

async function upsertConfig(key: string, value: string): Promise<void> {
  await prisma.config.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

async function assertSpeakerExists(speakerId: string | null | undefined): Promise<boolean> {
  if (!speakerId) {
    return true;
  }

  const speaker = await prisma.speaker.findUnique({ where: { id: speakerId } });
  return Boolean(speaker);
}

async function assertSpeakersExist(
  speakerIds: string[] | undefined,
): Promise<boolean> {
  if (!speakerIds?.length) {
    return true;
  }

  const uniqueIds = [...new Set(speakerIds)];
  const count = await prisma.speaker.count({
    where: { id: { in: uniqueIds } },
  });

  return count === uniqueIds.length;
}

function createExcelResponse(
  reply: FastifyReply,
  data: object[],
  filename: string,
): FastifyReply {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  const buffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  }) as Buffer;

  return reply
    .header(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    .header('Content-Disposition', `attachment; filename="${filename}"`)
    .send(buffer);
}

async function getQuizParticipantStats(): Promise<{
  totalQuestions: number;
  participants: Array<{
    userId: string;
    fullName: string;
    email: string;
    correctAnswers: number;
    completedAt: Date | null;
  }>;
}> {
  const [totalQuestions, correctByUser, participants, completionByUser] =
    await Promise.all([
      prisma.quizQuestion.count(),
      prisma.quizResult.groupBy({
        by: ['userId'],
        where: { isCorrect: true },
        _count: { _all: true },
      }),
      prisma.quizResult.groupBy({
        by: ['userId'],
        _count: { _all: true },
      }),
      prisma.quizResult.groupBy({
        by: ['userId'],
        _max: { createdAt: true },
      }),
    ]);

  const correctMap = new Map(
    correctByUser.map((row) => [row.userId, row._count._all]),
  );
  const completedAtMap = new Map(
    completionByUser.map((row) => [row.userId, row._max.createdAt]),
  );

  const userIds = participants.map((row) => row.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, fullName: true, email: true },
  });
  const userMap = new Map(users.map((user) => [user.id, user]));

  return {
    totalQuestions,
    participants: participants.map((row) => {
      const user = userMap.get(row.userId);

      return {
        userId: row.userId,
        fullName: user?.fullName ?? '',
        email: user?.email ?? '',
        correctAnswers: correctMap.get(row.userId) ?? 0,
        completedAt: completedAtMap.get(row.userId) ?? null,
      };
    }),
  };
}

export async function adminRoutes(fastify: FastifyInstance): Promise<void> {
  const auth = { preHandler: [requireAuth] };

  fastify.post('/login', async (request, reply) => {
    const parsed = parseBody(loginSchema, request.body);
    if (!parsed.success) {
      return validationError(reply, parsed.error);
    }

    const { email, password, codeWord } = parsed.data;

    if (codeWord !== env.ADMIN_CODE_WORD) {
      return reply.status(401).send({ error: 'Invalid code word' });
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = await fastify.jwt.sign({
      sub: admin.id,
      email: admin.email,
      role: 'admin',
    } satisfies AdminJwtPayload);

    return {
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    };
  });

  fastify.get('/stats', auth, async () => {
    const [
      usersTotal,
      usersVerified,
      speakers,
      scheduleSessions,
      questions,
      feedback,
      quizQuestions,
      notificationsPending,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.speaker.count(),
      prisma.scheduleSession.count(),
      prisma.questionToSpeaker.count(),
      prisma.feedback.count(),
      prisma.quizQuestion.count(),
      prisma.notification.count({ where: { isSent: false } }),
    ]);

    return {
      usersTotal,
      usersVerified,
      speakers,
      scheduleSessions,
      questions,
      feedback,
      quizQuestions,
      notificationsPending,
    };
  });

  fastify.get('/users', auth, async (request, reply) => {
    const query = usersQuerySchema.safeParse(request.query);
    if (!query.success) {
      return validationError(reply, query.error);
    }

    const { search } = query.data;

    return prisma.user.findMany({
      where: search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });
  });

  fastify.patch<{ Params: { id: string } }>(
    '/users/:id',
    auth,
    async (request, reply) => {
      const id = getRouteId(request.params);
      if (!id) {
        return notFound(reply, 'User');
      }

      const parsed = parseBody(userUpdateSchema, request.body);
      if (!parsed.success) {
        return validationError(reply, parsed.error);
      }

      try {
        return await prisma.user.update({
          where: { id },
          data: parsed.data,
        });
      } catch {
        return notFound(reply, 'User');
      }
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/users/:id',
    auth,
    async (request, reply) => {
      const id = getRouteId(request.params);
      if (!id) {
        return notFound(reply, 'User');
      }

      try {
        await prisma.user.delete({ where: { id } });
      } catch {
        return notFound(reply, 'User');
      }

      return reply.status(204).send();
    },
  );

  fastify.get('/users/export', auth, async (_request, reply) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const rows = users.map((user) => ({
      'MAX User ID': user.maxUserId.toString(),
      ФИО: user.fullName,
      Email: user.email,
      'Дата регистрации': formatDateTime(user.createdAt),
    }));

    return createExcelResponse(reply, rows, 'users.xlsx');
  });

  fastify.get('/notifications', auth, async (request, reply) => {
    const query = notificationsQuerySchema.safeParse(request.query);
    if (!query.success) {
      return validationError(reply, query.error);
    }

    const { status } = query.data;
    const where =
      status === 'pending'
        ? { isSent: false }
        : status === 'sent'
          ? { isSent: true }
          : {};

    return prisma.notification.findMany({
      where,
      orderBy:
        status === 'sent'
          ? [{ sentAt: 'desc' }, { createdAt: 'desc' }]
          : [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
    });
  });

  fastify.post('/notifications', auth, async (request, reply) => {
    const parsed = parseBody(notificationSchema, request.body);
    if (!parsed.success) {
      return validationError(reply, parsed.error);
    }

    const { text, scheduledAt } = parsed.data;

    if (scheduledAt) {
      if (scheduledAt.getTime() <= Date.now()) {
        return reply.status(400).send({
          error: 'Scheduled time must be in the future',
        });
      }

      const notification = await prisma.notification.create({
        data: { text, scheduledAt },
      });

      return reply.status(201).send(notification);
    }

    try {
      const sentCount = await broadcastToAll(text);
      const sentAt = new Date();
      const notification = await prisma.notification.create({
        data: { text, isSent: true, sentAt },
      });

      return { sent: true, sentCount, notification };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(503).send({
        error: 'Bot is unavailable for immediate broadcast',
      });
    }
  });

  fastify.patch<{ Params: { id: string } }>(
    '/notifications/:id',
    auth,
    async (request, reply) => {
      const id = getRouteId(request.params);
      if (!id) {
        return notFound(reply, 'Notification');
      }

      const parsed = parseBody(notificationUpdateSchema, request.body);
      if (!parsed.success) {
        return validationError(reply, parsed.error);
      }

      const existing = await prisma.notification.findUnique({ where: { id } });
      if (!existing) {
        return notFound(reply, 'Notification');
      }

      if (existing.isSent) {
        return reply.status(400).send({
          error: 'Cannot edit a notification that has already been sent',
        });
      }

      if (parsed.data.scheduledAt && parsed.data.scheduledAt.getTime() <= Date.now()) {
        return reply.status(400).send({
          error: 'Scheduled time must be in the future',
        });
      }

      try {
        return await prisma.notification.update({
          where: { id },
          data: parsed.data,
        });
      } catch {
        return notFound(reply, 'Notification');
      }
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/notifications/:id',
    auth,
    async (request, reply) => {
      const id = getRouteId(request.params);
      if (!id) {
        return notFound(reply, 'Notification');
      }

      const existing = await prisma.notification.findUnique({ where: { id } });
      if (!existing) {
        return notFound(reply, 'Notification');
      }

      if (existing.isSent) {
        return reply.status(400).send({
          error: 'Cannot delete a notification that has already been sent',
        });
      }

      try {
        await prisma.notification.delete({ where: { id } });
        return reply.status(204).send();
      } catch {
        return notFound(reply, 'Notification');
      }
    },
  );

  fastify.get('/speakers', auth, async () => {
    return prisma.speaker.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  });

  fastify.post('/speakers', auth, async (request, reply) => {
    const parsed = parseBody(speakerCreateSchema, request.body);
    if (!parsed.success) {
      return validationError(reply, parsed.error);
    }

    return reply.status(201).send(
      await prisma.speaker.create({ data: parsed.data }),
    );
  });

  fastify.put('/speakers/reorder', auth, async (request, reply) => {
    const parsed = parseBody(speakerReorderSchema, request.body);
    if (!parsed.success) {
      return validationError(reply, parsed.error);
    }

    await Promise.all(
      parsed.data.items.map((item) =>
        prisma.speaker.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );

    return prisma.speaker.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  });

  fastify.get<{ Params: { id: string } }>(
    '/speakers/:id/questions',
    auth,
    async (request, reply) => {
      const id = getRouteId(request.params);
      if (!id) {
        return notFound(reply, 'Speaker');
      }

      const speaker = await prisma.speaker.findUnique({ where: { id } });
      if (!speaker) {
        return notFound(reply, 'Speaker');
      }

      const questions = await prisma.questionToSpeaker.findMany({
        where: { speakerId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { fullName: true, email: true } },
        },
      });

      return questions.map((item) => ({
        id: item.id,
        question: item.question,
        userFullName: item.user.fullName,
        userEmail: item.user.email,
        createdAt: item.createdAt,
      }));
    },
  );

  fastify.put<{ Params: { id: string } }>(
    '/speakers/:id',
    auth,
    async (request, reply) => {
      const id = getRouteId(request.params);
      if (!id) {
        return notFound(reply, 'Speaker');
      }

      const parsed = parseBody(speakerUpdateSchema, request.body);
      if (!parsed.success) {
        return validationError(reply, parsed.error);
      }

      try {
        return await prisma.speaker.update({
          where: { id },
          data: parsed.data,
          include: speakerWithSessionsCountInclude,
        });
      } catch {
        return notFound(reply, 'Speaker');
      }
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/speakers/:id',
    auth,
    async (request, reply) => {
      const id = getRouteId(request.params);
      if (!id) {
        return notFound(reply, 'Speaker');
      }

      try {
        await prisma.speaker.delete({ where: { id } });
        return reply.status(204).send();
      } catch {
        return notFound(reply, 'Speaker');
      }
    },
  );

  fastify.get('/quiz/questions', auth, async () => {
    return prisma.quizQuestion.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  });

  fastify.post('/quiz/questions', auth, async (request, reply) => {
    const parsed = parseBody(quizQuestionCreateSchema, request.body);
    if (!parsed.success) {
      return validationError(reply, parsed.error);
    }

    return reply.status(201).send(
      await prisma.quizQuestion.create({ data: parsed.data }),
    );
  });

  fastify.put<{ Params: { id: string } }>(
    '/quiz/questions/:id',
    auth,
    async (request, reply) => {
      const id = getRouteId(request.params);
      if (!id) {
        return notFound(reply, 'Question');
      }

      const parsed = parseBody(quizQuestionUpdateSchema, request.body);
      if (!parsed.success) {
        return validationError(reply, parsed.error);
      }

      try {
        return await prisma.quizQuestion.update({
          where: { id },
          data: parsed.data,
        });
      } catch {
        return notFound(reply, 'Question');
      }
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/quiz/questions/:id',
    auth,
    async (request, reply) => {
      const id = getRouteId(request.params);
      if (!id) {
        return notFound(reply, 'Question');
      }

      try {
        await prisma.quizQuestion.delete({ where: { id } });
        return reply.status(204).send();
      } catch {
        return notFound(reply, 'Question');
      }
    },
  );

  fastify.get('/quiz/results', auth, async () => {
    const [totalQuestions, correctByUser, participants] = await Promise.all([
      prisma.quizQuestion.count(),
      prisma.quizResult.groupBy({
        by: ['userId'],
        where: { isCorrect: true },
        _count: { _all: true },
      }),
      prisma.quizResult.groupBy({
        by: ['userId'],
        _count: { _all: true },
      }),
    ]);

    const correctMap = new Map(
      correctByUser.map((row) => [row.userId, row._count._all]),
    );

    const userIds = participants.map((row) => row.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true, email: true },
    });

    const userMap = new Map(users.map((user) => [user.id, user]));

    const results = participants.map((row) => {
      const user = userMap.get(row.userId);
      const correctAnswers = correctMap.get(row.userId) ?? 0;

      return {
        userId: row.userId,
        fullName: user?.fullName ?? '',
        email: user?.email ?? '',
        correctAnswers,
        totalQuestions,
      };
    });

    const winners = results.filter(
      (row) => totalQuestions > 0 && row.correctAnswers === totalQuestions,
    );

    return { results, winners };
  });

  fastify.delete<{ Params: { id: string } }>(
    '/quiz/participants/:id',
    auth,
    async (request, reply) => {
      const id = getRouteId(request.params);
      if (!id) {
        return notFound(reply, 'Participant');
      }

      const deleted = await prisma.quizResult.deleteMany({
        where: { userId: id },
      });

      if (deleted.count === 0) {
        return notFound(reply, 'Participant');
      }

      return reply.status(204).send();
    },
  );

  fastify.get('/quiz/results/export', auth, async (_request, reply) => {
    const { totalQuestions, participants } = await getQuizParticipantStats();

    const rows = participants.map((row) => ({
      ФИО: row.fullName,
      Email: row.email,
      'Правильных ответов': row.correctAnswers,
      'Всего вопросов': totalQuestions,
      Победитель:
        totalQuestions > 0 && row.correctAnswers === totalQuestions
          ? 'Да'
          : 'Нет',
    }));

    return createExcelResponse(reply, rows, 'quiz-results.xlsx');
  });

  fastify.get('/quiz/winners/export', auth, async (_request, reply) => {
    const { totalQuestions, participants } = await getQuizParticipantStats();

    const rows = participants
      .filter(
        (row) =>
          totalQuestions > 0 && row.correctAnswers === totalQuestions,
      )
      .map((row) => ({
        ФИО: row.fullName,
        Email: row.email,
        'Дата прохождения': row.completedAt
          ? formatDateTime(row.completedAt)
          : '',
      }));

    return createExcelResponse(reply, rows, 'quiz-winners.xlsx');
  });

  fastify.get('/questions/export', auth, async (_request, reply) => {
    const questions = await prisma.questionToSpeaker.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, email: true } },
        speaker: { select: { name: true } },
      },
    });

    const rows = questions.map((item) => ({
      Спикер: item.speaker.name,
      'ФИО участника': item.user.fullName,
      'Email участника': item.user.email,
      Вопрос: item.question,
      Дата: formatDateTime(item.createdAt),
    }));

    return createExcelResponse(reply, rows, 'questions.xlsx');
  });

  fastify.get('/feedback/export', auth, async (_request, reply) => {
    const feedbackList = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, email: true } },
      },
    });

    const rows = feedbackList.map((item) => ({
      'ФИО участника': item.user?.fullName ?? '',
      'Email участника': item.user?.email ?? '',
      Текст: item.text,
      Дата: formatDateTime(item.createdAt),
    }));

    return createExcelResponse(reply, rows, 'feedback.xlsx');
  });

  fastify.get<{ Params: { key: string } }>(
    '/config/:key',
    auth,
    async (request, reply) => {
      const parsed = configKeySchema.safeParse(request.params);
      if (!parsed.success) {
        return validationError(reply, parsed.error);
      }

      const config = await prisma.config.findUnique({
        where: { key: parsed.data.key },
      });

      if (!config) {
        return notFound(reply, 'Config');
      }

      return config;
    },
  );

  fastify.put<{ Params: { key: string } }>(
    '/config/:key',
    auth,
    async (request, reply) => {
      const keyParsed = configKeySchema.safeParse(request.params);
      if (!keyParsed.success) {
        return validationError(reply, keyParsed.error);
      }

      const bodyParsed = parseBody(configUpdateSchema, request.body);
      if (!bodyParsed.success) {
        return validationError(reply, bodyParsed.error);
      }

      return prisma.config.upsert({
        where: { key: keyParsed.data.key },
        create: { key: keyParsed.data.key, value: bodyParsed.data.value },
        update: { value: bodyParsed.data.value },
      });
    },
  );

  fastify.post('/config/map-image', auth, async (request, reply) => {
    const file = await request.file();

    if (!file || file.fieldname !== 'image') {
      return reply.status(400).send({ error: 'Image file is required' });
    }

    const url = await saveUploadedFile(file, 'maps');

    await prisma.config.upsert({
      where: { key: 'map_image_url' },
      create: { key: 'map_image_url', value: url },
      update: { value: url },
    });

    return { url };
  });

  fastify.delete('/config/map-image', auth, async (_request, reply) => {
    await prisma.config.upsert({
      where: { key: LINK_CONFIG_KEYS.mapImageUrl },
      create: { key: LINK_CONFIG_KEYS.mapImageUrl, value: '' },
      update: { value: '' },
    });

    return reply.status(204).send();
  });

  fastify.get('/links', auth, async () => {
    const config = await getConfigMap(Object.values(LINK_CONFIG_KEYS));

    return {
      chatUrl: config.get(LINK_CONFIG_KEYS.chatUrl) ?? '',
      stickerUrl: config.get(LINK_CONFIG_KEYS.stickerUrl) ?? '',
      quizUrl: config.get(LINK_CONFIG_KEYS.quizUrl) ?? '',
      mapImageUrl: config.get(LINK_CONFIG_KEYS.mapImageUrl) ?? '',
    };
  });

  fastify.put('/links', auth, async (request, reply) => {
    const parsed = parseBody(linksUpdateSchema, request.body);
    if (!parsed.success) {
      return validationError(reply, parsed.error);
    }

    const updates: Array<[string, string]> = [];
    if (parsed.data.chatUrl !== undefined) {
      updates.push([LINK_CONFIG_KEYS.chatUrl, parsed.data.chatUrl]);
    }
    if (parsed.data.stickerUrl !== undefined) {
      updates.push([LINK_CONFIG_KEYS.stickerUrl, parsed.data.stickerUrl]);
    }
    if (parsed.data.quizUrl !== undefined) {
      updates.push([LINK_CONFIG_KEYS.quizUrl, parsed.data.quizUrl]);
    }

    await Promise.all(
      updates.map(([key, value]) => upsertConfig(key, value)),
    );

    const config = await getConfigMap(Object.values(LINK_CONFIG_KEYS));

    return {
      chatUrl: config.get(LINK_CONFIG_KEYS.chatUrl) ?? '',
      stickerUrl: config.get(LINK_CONFIG_KEYS.stickerUrl) ?? '',
      quizUrl: config.get(LINK_CONFIG_KEYS.quizUrl) ?? '',
      mapImageUrl: config.get(LINK_CONFIG_KEYS.mapImageUrl) ?? '',
    };
  });

  fastify.get('/texts', auth, async () => {
    const config = await getConfigMap(Object.values(TEXT_CONFIG_KEYS));

    return {
      eventDescription: config.get(TEXT_CONFIG_KEYS.eventDescription) ?? '',
      botWelcome: config.get(TEXT_CONFIG_KEYS.botWelcome) ?? '',
    };
  });

  fastify.put('/texts', auth, async (request, reply) => {
    const parsed = parseBody(textsUpdateSchema, request.body);
    if (!parsed.success) {
      return validationError(reply, parsed.error);
    }

    const updates: Array<[string, string]> = [];
    if (parsed.data.eventDescription !== undefined) {
      updates.push([
        TEXT_CONFIG_KEYS.eventDescription,
        parsed.data.eventDescription,
      ]);
    }
    if (parsed.data.botWelcome !== undefined) {
      updates.push([TEXT_CONFIG_KEYS.botWelcome, parsed.data.botWelcome]);
    }

    await Promise.all(
      updates.map(([key, value]) => upsertConfig(key, value)),
    );

    const config = await getConfigMap(Object.values(TEXT_CONFIG_KEYS));

    return {
      eventDescription: config.get(TEXT_CONFIG_KEYS.eventDescription) ?? '',
      botWelcome: config.get(TEXT_CONFIG_KEYS.botWelcome) ?? '',
    };
  });

  fastify.post<{ Params: { id: string } }>(
    '/speakers/:id/photo',
    auth,
    async (request, reply) => {
      const id = getRouteId(request.params);
      if (!id) {
        return notFound(reply, 'Speaker');
      }

      const file = await request.file();

      if (!file || file.fieldname !== 'photo') {
        return reply.status(400).send({ error: 'Photo file is required' });
      }

      const url = await saveUploadedFile(file, 'speakers');

      try {
        await prisma.speaker.update({
          where: { id },
          data: { photoUrl: url },
        });
      } catch {
        return notFound(reply, 'Speaker');
      }

      return { url };
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/speakers/:id/photo',
    auth,
    async (request, reply) => {
      const id = getRouteId(request.params);
      if (!id) {
        return notFound(reply, 'Speaker');
      }

      try {
        await prisma.speaker.update({
          where: { id },
          data: { photoUrl: null },
        });
      } catch {
        return notFound(reply, 'Speaker');
      }

      return reply.status(204).send();
    },
  );

  fastify.get('/questions', auth, async () => {
    return prisma.questionToSpeaker.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        speaker: { select: { id: true, name: true } },
      },
    });
  });

  fastify.get('/feedback', auth, async () => {
    return prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
  });

  fastify.get('/schedule', auth, async () => {
    const sessions = await prisma.scheduleSession.findMany({
      orderBy: { order: 'asc' },
      include: scheduleSessionInclude,
    });

    return serializeScheduleSessions(sessions);
  });

  fastify.get('/schedule/export', auth, async (_request, reply) => {
    const sessions = await prisma.scheduleSession.findMany({
      orderBy: { order: 'asc' },
      include: scheduleSessionInclude,
    });

    const rows = sessions.map((session) => ({
      Начало: formatScheduleTime(session.startTime),
      Конец: formatScheduleTime(session.endTime),
      Тема: session.title,
      Трек: session.track,
      Описание: session.description ?? '',
      Место: session.location ?? '',
      Спикеры: session.sessionSpeakers.map((link) => link.speaker.name).join(', '),
    }));

    return createExcelResponse(reply, rows, 'schedule.xlsx');
  });

  fastify.post('/schedule', auth, async (request, reply) => {
    const parsed = parseBody(scheduleCreateSchema, request.body);
    if (!parsed.success) {
      return validationError(reply, parsed.error);
    }

    const speakerIds = resolveSessionSpeakerIds(parsed.data);

    if (!(await assertSpeakersExist(speakerIds))) {
      return reply.status(400).send({ error: 'Speaker not found' });
    }

    const { startTime, endTime, speakerIds: _s, speakerId: _id, order, ...rest } =
      parsed.data;

    const created = await prisma.scheduleSession.create({
      data: {
        ...rest,
        order: order ?? (await getNextScheduleSessionOrder()),
        startTime: scheduleTimeToDate(startTime),
        endTime: scheduleTimeToDate(endTime),
        sessionSpeakers: buildSessionSpeakersCreate(speakerIds),
      },
      include: scheduleSessionInclude,
    });

    return reply.status(201).send(serializeScheduleSession(created));
  });

  fastify.put('/schedule/reorder', auth, async (request, reply) => {
    const parsed = parseBody(scheduleReorderSchema, request.body);
    if (!parsed.success) {
      return validationError(reply, parsed.error);
    }

    await Promise.all(
      parsed.data.items.map((item) =>
        prisma.scheduleSession.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );

    const sessions = await prisma.scheduleSession.findMany({
      orderBy: { order: 'asc' },
      include: scheduleSessionInclude,
    });

    return serializeScheduleSessions(sessions);
  });

  fastify.put<{ Params: { id: string } }>(
    '/schedule/:id',
    auth,
    async (request, reply) => {
      const id = getRouteId(request.params);
      if (!id) {
        return notFound(reply, 'Session');
      }

      const parsed = parseBody(scheduleUpdateSchema, request.body);
      if (!parsed.success) {
        return validationError(reply, parsed.error);
      }

      const speakerIds = resolveSessionSpeakerIds(parsed.data);

      if (speakerIds !== undefined && !(await assertSpeakersExist(speakerIds))) {
        return reply.status(400).send({ error: 'Speaker not found' });
      }

      const existing = await prisma.scheduleSession.findUnique({ where: { id } });
      if (!existing) {
        return notFound(reply, 'Session');
      }

      const nextStartTime = parsed.data.startTime
        ? scheduleTimeToDate(parsed.data.startTime)
        : existing.startTime;
      const nextEndTime = parsed.data.endTime
        ? scheduleTimeToDate(parsed.data.endTime)
        : existing.endTime;

      const startMinutes = parsed.data.startTime
        ? scheduleTimeToMinutes(parsed.data.startTime)
        : scheduleTimeToMinutes(formatScheduleTime(existing.startTime));
      const endMinutes = parsed.data.endTime
        ? scheduleTimeToMinutes(parsed.data.endTime)
        : scheduleTimeToMinutes(formatScheduleTime(existing.endTime));

      if (endMinutes <= startMinutes) {
        return reply.status(400).send({ error: 'endTime must be after startTime' });
      }

      const {
        startTime,
        endTime,
        speakerIds: _speakerIds,
        speakerId: _speakerId,
        ...rest
      } = parsed.data;

      try {
        const updated = await prisma.scheduleSession.update({
          where: { id },
          data: {
            ...rest,
            ...(startTime !== undefined ? { startTime: nextStartTime } : {}),
            ...(endTime !== undefined ? { endTime: nextEndTime } : {}),
            ...(speakerIds !== undefined
              ? {
                  sessionSpeakers: {
                    deleteMany: {},
                    create: speakerIds.map((speakerId, order) => ({
                      speakerId,
                      order,
                    })),
                  },
                }
              : {}),
          },
          include: scheduleSessionInclude,
        });

        return serializeScheduleSession(updated);
      } catch {
        return notFound(reply, 'Session');
      }
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/schedule/:id',
    auth,
    async (request, reply) => {
      const id = getRouteId(request.params);
      if (!id) {
        return notFound(reply, 'Session');
      }

      try {
        await prisma.scheduleSession.delete({ where: { id } });
        return reply.status(204).send();
      } catch {
        return notFound(reply, 'Session');
      }
    },
  );
}
