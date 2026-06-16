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
  partnerCreateSchema,
  partnerReorderSchema,
  partnerUpdateSchema,
  speakerCreateSchema,
  speakerReorderSchema,
  speakerUpdateSchema,
} from '../shared/schemas/admin';
import { invalidateAllContentCaches } from '../shared/invalidateContentCaches';
import { createQuizQuestionRecord } from '../shared/quizQuestion';
import { normalizeQuizCategory } from '../shared/quizCategory';
import { isQuizComplete, isQuizWinner } from '../shared/quizStatus';
import {
  PARTNERS_VISIBLE_CONFIG_KEY,
  isSectionVisible,
} from '../shared/sectionVisibility';
import {
  QUIZ_START_AT_CONFIG_KEY,
  QUIZ_VISIBLE_CONFIG_KEY,
  resolveQuizVisibilityFromConfig,
  type QuizVisibilityState,
} from '../shared/quizVisibility';
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
import { PARTNER_LOGO_EXTENSIONS, saveUploadedFile } from '../shared/upload';
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
  stickerUrl: 'sticker_url',
  quizUrl: 'quiz_url',
  mapImageUrl: 'map_image_url',
} as const;

const TEXT_CONFIG_KEYS = {
  eventDescription: 'event_description',
  botWelcome: 'bot_welcome',
} as const;

const sectionVisibilitySchema = z.object({
  visible: z.boolean(),
});

const quizVisibilityUpdateSchema = z
  .object({
    visible: z.boolean().optional(),
    startAt: z.union([z.string().min(1), z.null()]).optional(),
  })
  .refine((data) => data.visible !== undefined || data.startAt !== undefined, {
    message: 'At least one field is required',
  })
  .refine(
    (data) =>
      data.startAt === undefined ||
      data.startAt === null ||
      !Number.isNaN(Date.parse(data.startAt)),
    { message: 'Invalid startAt datetime', path: ['startAt'] },
  );

async function isPartnersSectionVisible(): Promise<boolean> {
  const config = await getConfigMap([PARTNERS_VISIBLE_CONFIG_KEY]);
  return isSectionVisible(config.get(PARTNERS_VISIBLE_CONFIG_KEY));
}

async function getQuizVisibilityState(nowMs = Date.now()): Promise<QuizVisibilityState> {
  const config = await getConfigMap([QUIZ_VISIBLE_CONFIG_KEY, QUIZ_START_AT_CONFIG_KEY]);
  return resolveQuizVisibilityFromConfig(config, nowMs);
}

function serializeQuizVisibility(state: QuizVisibilityState) {
  return {
    manuallyEnabled: state.manuallyEnabled,
    startAt: state.startAt,
    sectionVisible: state.sectionVisible,
    awaitingSchedule: state.awaitingSchedule,
  };
}

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
  invalidateAllContentCaches();
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
    answeredQuestions: number;
    correctAnswers: number;
    isComplete: boolean;
    isWinner: boolean;
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
      const answeredQuestions = row._count._all;
      const correctAnswers = correctMap.get(row.userId) ?? 0;
      const complete = isQuizComplete(answeredQuestions, totalQuestions);

      return {
        userId: row.userId,
        fullName: user?.fullName ?? '',
        email: user?.email ?? '',
        answeredQuestions,
        correctAnswers,
        isComplete: complete,
        isWinner: isQuizWinner(
          answeredQuestions,
          correctAnswers,
          totalQuestions,
        ),
        completedAt: complete
          ? (completedAtMap.get(row.userId) ?? null)
          : null,
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
      return reply.status(401).send({ error: 'Неверное кодовое слово' });
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return reply.status(401).send({ error: 'Неверный email или пароль' });
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

    const notification = await prisma.notification.create({
      data: { text, isSent: false },
    });

    void broadcastToAll(text)
      .then(async (sentCount) => {
        await prisma.notification.update({
          where: { id: notification.id },
          data: { isSent: true, sentAt: new Date() },
        });
        fastify.log.info(
          { notificationId: notification.id, sentCount },
          'Immediate broadcast completed',
        );
      })
      .catch((error) => {
        fastify.log.error(
          { err: error, notificationId: notification.id },
          'Immediate broadcast failed',
        );
      });

    return reply.status(202).send({
      accepted: true,
      notification,
    });
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

  fastify.get('/partners', auth, async () => {
    const [partners, sectionVisible] = await Promise.all([
      prisma.partner.findMany({
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      }),
      isPartnersSectionVisible(),
    ]);

    return { sectionVisible, partners };
  });

  fastify.put('/partners/visibility', auth, async (request, reply) => {
    const parsed = parseBody(sectionVisibilitySchema, request.body);
    if (!parsed.success) {
      return validationError(reply, parsed.error);
    }

    await upsertConfig(
      PARTNERS_VISIBLE_CONFIG_KEY,
      parsed.data.visible ? 'true' : 'false',
    );

    return { sectionVisible: parsed.data.visible };
  });

  fastify.post('/partners', auth, async (request, reply) => {
    const parsed = parseBody(partnerCreateSchema, request.body);
    if (!parsed.success) {
      return validationError(reply, parsed.error);
    }

    return reply.status(201).send(
      await prisma.partner.create({ data: parsed.data }),
    );
  });

  fastify.put('/partners/reorder', auth, async (request, reply) => {
    const parsed = parseBody(partnerReorderSchema, request.body);
    if (!parsed.success) {
      return validationError(reply, parsed.error);
    }

    await Promise.all(
      parsed.data.items.map((item) =>
        prisma.partner.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );

    return prisma.partner.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  });

  fastify.put<{ Params: { id: string } }>(
    '/partners/:id',
    auth,
    async (request, reply) => {
      const id = getRouteId(request.params);
      if (!id) {
        return notFound(reply, 'Partner');
      }

      const parsed = parseBody(partnerUpdateSchema, request.body);
      if (!parsed.success) {
        return validationError(reply, parsed.error);
      }

      try {
        return await prisma.partner.update({
          where: { id },
          data: parsed.data,
        });
      } catch {
        return notFound(reply, 'Partner');
      }
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/partners/:id',
    auth,
    async (request, reply) => {
      const id = getRouteId(request.params);
      if (!id) {
        return notFound(reply, 'Partner');
      }

      try {
        await prisma.partner.delete({ where: { id } });
        return reply.status(204).send();
      } catch {
        return notFound(reply, 'Partner');
      }
    },
  );

  fastify.get('/quiz/questions', auth, async () => {
    const [questions, visibility] = await Promise.all([
      prisma.quizQuestion.findMany({
        orderBy: [{ category: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
      }),
      getQuizVisibilityState(),
    ]);

    return {
      ...serializeQuizVisibility(visibility),
      questions,
    };
  });

  fastify.put('/quiz/visibility', auth, async (request, reply) => {
    const parsed = parseBody(quizVisibilityUpdateSchema, request.body);
    if (!parsed.success) {
      return validationError(reply, parsed.error);
    }

    if (parsed.data.visible !== undefined) {
      await upsertConfig(
        QUIZ_VISIBLE_CONFIG_KEY,
        parsed.data.visible ? 'true' : 'false',
      );
    }

    if (parsed.data.startAt !== undefined) {
      if (parsed.data.startAt === null) {
        await prisma.config.deleteMany({
          where: { key: QUIZ_START_AT_CONFIG_KEY },
        });
        invalidateAllContentCaches();
      } else {
        await upsertConfig(QUIZ_START_AT_CONFIG_KEY, parsed.data.startAt);
      }
    }

    return serializeQuizVisibility(await getQuizVisibilityState());
  });

  fastify.post('/quiz/questions', auth, async (request, reply) => {
    const parsed = parseBody(quizQuestionCreateSchema, request.body);
    if (!parsed.success) {
      return validationError(reply, parsed.error);
    }

    const { order, ...rest } = parsed.data;

    return reply.status(201).send(
      await createQuizQuestionRecord(rest, order),
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
        const { category, ...rest } = parsed.data;
        const updated = await prisma.quizQuestion.update({
          where: { id },
          data: {
            ...rest,
            ...(category !== undefined
              ? { category: normalizeQuizCategory(category) }
              : {}),
          },
        });
        invalidateAllContentCaches();
        return updated;
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
        invalidateAllContentCaches();
        return reply.status(204).send();
      } catch {
        return notFound(reply, 'Question');
      }
    },
  );

  fastify.get('/quiz/results', auth, async () => {
    const { totalQuestions, participants } = await getQuizParticipantStats();

    const results = participants.map((row) => ({
      userId: row.userId,
      fullName: row.fullName,
      email: row.email,
      answeredQuestions: row.answeredQuestions,
      correctAnswers: row.correctAnswers,
      totalQuestions,
      isComplete: row.isComplete,
      isWinner: row.isWinner,
    }));

    const winners = results.filter((row) => row.isWinner);

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
      'Отвечено вопросов': row.answeredQuestions,
      'Правильных ответов': row.correctAnswers,
      'Всего вопросов': totalQuestions,
      Статус: row.isComplete ? 'Завершён' : 'В процессе',
      Победитель: row.isWinner ? 'Да' : 'Нет',
    }));

    return createExcelResponse(reply, rows, 'quiz-results.xlsx');
  });

  fastify.get('/quiz/winners/export', auth, async (_request, reply) => {
    const { totalQuestions, participants } = await getQuizParticipantStats();

    const rows = participants
      .filter((row) => row.isWinner)
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

      await upsertConfig(keyParsed.data.key, bodyParsed.data.value);
      return prisma.config.findUniqueOrThrow({
        where: { key: keyParsed.data.key },
      });
    },
  );

  fastify.post('/config/map-image', auth, async (request, reply) => {
    const file = await request.file();

    if (!file || file.fieldname !== 'image') {
      return reply.status(400).send({ error: 'Image file is required' });
    }

    const url = await saveUploadedFile(file, 'maps');

    await upsertConfig('map_image_url', url);

    return { url };
  });

  fastify.delete('/config/map-image', auth, async (_request, reply) => {
    await upsertConfig(LINK_CONFIG_KEYS.mapImageUrl, '');

    return reply.status(204).send();
  });

  fastify.get('/links', auth, async () => {
    const config = await getConfigMap(Object.values(LINK_CONFIG_KEYS));

    return {
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

  fastify.post<{ Params: { id: string } }>(
    '/partners/:id/logo',
    auth,
    async (request, reply) => {
      const id = getRouteId(request.params);
      if (!id) {
        return notFound(reply, 'Partner');
      }

      const file = await request.file();

      if (!file || file.fieldname !== 'logo') {
        return reply.status(400).send({ error: 'Logo file is required' });
      }

      const url = await saveUploadedFile(file, 'partners', PARTNER_LOGO_EXTENSIONS);

      try {
        await prisma.partner.update({
          where: { id },
          data: { logoUrl: url },
        });
      } catch {
        return notFound(reply, 'Partner');
      }

      return { url };
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/partners/:id/logo',
    auth,
    async (request, reply) => {
      const id = getRouteId(request.params);
      if (!id) {
        return notFound(reply, 'Partner');
      }

      try {
        await prisma.partner.update({
          where: { id },
          data: { logoUrl: null },
        });
      } catch {
        return notFound(reply, 'Partner');
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

  fastify.delete<{ Params: { id: string } }>(
    '/questions/:id',
    auth,
    async (request, reply) => {
      const id = getRouteId(request.params);
      if (!id) {
        return notFound(reply, 'Question');
      }

      try {
        await prisma.questionToSpeaker.delete({ where: { id } });
        return reply.status(204).send();
      } catch {
        return notFound(reply, 'Question');
      }
    },
  );

  fastify.get('/feedback', auth, async () => {
    return prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
  });

  fastify.delete<{ Params: { id: string } }>(
    '/feedback/:id',
    auth,
    async (request, reply) => {
      const id = getRouteId(request.params);
      if (!id) {
        return notFound(reply, 'Feedback');
      }

      try {
        await prisma.feedback.delete({ where: { id } });
        return reply.status(204).send();
      } catch {
        return notFound(reply, 'Feedback');
      }
    },
  );

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
