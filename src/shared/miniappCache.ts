import type { QuizCorrectOption } from '@prisma/client';
import { prisma } from '../db/client';
import {
  QUIZ_START_AT_CONFIG_KEY,
  QUIZ_VISIBLE_CONFIG_KEY,
  resolveQuizVisibilityFromConfig,
} from './quizVisibility';

const CONFIG_TTL_MS = 30_000;
const QUESTIONS_TTL_MS = 30_000;
const VISIBILITY_TTL_MS = 5_000;
const TOTAL_QUESTIONS_TTL_MS = 30_000;

const PUBLIC_CONFIG_KEYS = [
  'event_description',
  'sticker_url',
  'map_image_url',
  'quiz_url',
  QUIZ_VISIBLE_CONFIG_KEY,
  QUIZ_START_AT_CONFIG_KEY,
] as const;

export type PublicConfig = Record<(typeof PUBLIC_CONFIG_KEYS)[number], string>;

export type CachedQuizQuestionPublic = {
  id: string;
  category: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  order: number;
};

export type CachedQuizQuestionAnswer = CachedQuizQuestionPublic & {
  correctOption: QuizCorrectOption;
};

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

let publicConfigCache: CacheEntry<PublicConfig> | null = null;
let quizQuestionsPublicCache: CacheEntry<CachedQuizQuestionPublic[]> | null = null;
let quizQuestionsAnswerCache: CacheEntry<Map<string, CachedQuizQuestionAnswer>> | null =
  null;
let visibilityCache: CacheEntry<boolean> | null = null;
let totalQuestionsCache: CacheEntry<number> | null = null;

function isFresh<T>(entry: CacheEntry<T> | null, nowMs: number): entry is CacheEntry<T> {
  return entry !== null && entry.expiresAt > nowMs;
}

function buildPublicConfig(
  rows: Array<{ key: string; value: string }>,
): PublicConfig {
  const config = Object.fromEntries(rows.map((row) => [row.key, row.value])) as Partial<
    PublicConfig
  >;

  for (const key of PUBLIC_CONFIG_KEYS) {
    if (!(key in config)) {
      config[key] = '';
    }
  }

  return config as PublicConfig;
}

export async function getCachedPublicConfig(nowMs = Date.now()): Promise<PublicConfig> {
  if (isFresh(publicConfigCache, nowMs)) {
    return publicConfigCache.value;
  }

  const rows = await prisma.config.findMany();
  const value = buildPublicConfig(rows);
  publicConfigCache = { value, expiresAt: nowMs + CONFIG_TTL_MS };
  return value;
}

export async function getCachedQuizQuestionsPublic(
  nowMs = Date.now(),
): Promise<CachedQuizQuestionPublic[]> {
  if (isFresh(quizQuestionsPublicCache, nowMs)) {
    return quizQuestionsPublicCache.value;
  }

  const rows = await prisma.quizQuestion.findMany({
    select: {
      id: true,
      category: true,
      question: true,
      optionA: true,
      optionB: true,
      optionC: true,
      optionD: true,
      order: true,
    },
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  });

  quizQuestionsPublicCache = {
    value: rows,
    expiresAt: nowMs + QUESTIONS_TTL_MS,
  };
  return rows;
}

export async function getCachedQuizQuestionForAnswer(
  questionId: string,
  nowMs = Date.now(),
): Promise<CachedQuizQuestionAnswer | null> {
  if (!isFresh(quizQuestionsAnswerCache, nowMs)) {
    const rows = await prisma.quizQuestion.findMany({
      select: {
        id: true,
        category: true,
        question: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        order: true,
        correctOption: true,
      },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    });

    quizQuestionsAnswerCache = {
      value: new Map(rows.map((row) => [row.id, row])),
      expiresAt: nowMs + QUESTIONS_TTL_MS,
    };
  }

  return quizQuestionsAnswerCache.value.get(questionId) ?? null;
}

export async function getCachedQuizVisibility(nowMs = Date.now()): Promise<boolean> {
  if (isFresh(visibilityCache, nowMs)) {
    return visibilityCache.value;
  }

  const rows = await prisma.config.findMany({
    where: {
      key: { in: [QUIZ_VISIBLE_CONFIG_KEY, QUIZ_START_AT_CONFIG_KEY] },
    },
  });
  const config = new Map(rows.map((row) => [row.key, row.value]));
  const value = resolveQuizVisibilityFromConfig(config, nowMs).sectionVisible;
  visibilityCache = { value, expiresAt: nowMs + VISIBILITY_TTL_MS };
  return value;
}

export async function getCachedTotalQuestions(nowMs = Date.now()): Promise<number> {
  if (isFresh(totalQuestionsCache, nowMs)) {
    return totalQuestionsCache.value;
  }

  const value = await prisma.quizQuestion.count();
  totalQuestionsCache = { value, expiresAt: nowMs + TOTAL_QUESTIONS_TTL_MS };
  return value;
}

export function invalidateMiniappCaches(): void {
  publicConfigCache = null;
  quizQuestionsPublicCache = null;
  quizQuestionsAnswerCache = null;
  visibilityCache = null;
  totalQuestionsCache = null;
}
