import { prisma } from '../db/client';
import type { QuizLiveState } from './quizLiveState';
import {
  QUIZ_START_AT_CONFIG_KEY,
  QUIZ_VISIBLE_CONFIG_KEY,
  resolveQuizVisibilityFromConfig,
} from './quizVisibility';

export async function fetchQuizLiveStateFromDb(
  nowMs = Date.now(),
): Promise<QuizLiveState> {
  const [configRows, questionsCount, questionAgg] = await Promise.all([
    prisma.config.findMany({
      where: {
        key: { in: [QUIZ_VISIBLE_CONFIG_KEY, QUIZ_START_AT_CONFIG_KEY] },
      },
      select: { key: true, value: true, updatedAt: true },
    }),
    prisma.quizQuestion.count(),
    prisma.quizQuestion.aggregate({ _max: { updatedAt: true } }),
  ]);

  const config = new Map(configRows.map((row) => [row.key, row.value]));
  const visibility = resolveQuizVisibilityFromConfig(config, nowMs);

  const configRevision = configRows
    .map((row) => `${row.key}:${row.value}:${row.updatedAt.getTime()}`)
    .sort()
    .join('|');
  const questionRevision = questionAgg._max.updatedAt?.getTime() ?? 0;
  const revision = `${configRevision}|q:${questionsCount}:${questionRevision}|t:${visibility.sectionVisible ? 1 : 0}`;

  return {
    revision,
    sectionVisible: visibility.sectionVisible,
    questionsCount,
    awaitingSchedule: visibility.awaitingSchedule,
    startsAtMs: visibility.startsAtMs,
  };
}
