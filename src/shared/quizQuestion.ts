import { Prisma, type QuizCorrectOption } from '@prisma/client';
import { prisma } from '../db/client';
import { invalidateAllContentCaches } from './invalidateContentCaches';

import { normalizeQuizCategory } from './quizCategory';

export type QuizQuestionInput = {
  category?: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: QuizCorrectOption;
};

/** Next display_order so new questions appear at the end of the admin list. */
export async function getNextQuizQuestionOrder(): Promise<number> {
  const { _max } = await prisma.quizQuestion.aggregate({
    _max: { order: true },
  });

  return (_max.order ?? -1) + 1;
}

function isDisplayOrderConflict(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    return false;
  }

  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.some(
      (field) => field === 'display_order' || field === 'order',
    );
  }

  if (typeof target === 'string') {
    return target.includes('display_order');
  }

  return false;
}

export async function createQuizQuestionRecord(
  data: QuizQuestionInput,
  preferredOrder?: number,
) {
  let order = preferredOrder ?? (await getNextQuizQuestionOrder());

  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const created = await prisma.quizQuestion.create({
        data: {
          ...data,
          category: normalizeQuizCategory(data.category),
          order,
        },
      });
      invalidateAllContentCaches();
      return created;
    } catch (error) {
      if (preferredOrder !== undefined || !isDisplayOrderConflict(error)) {
        throw error;
      }

      order += 1;
    }
  }

  throw new Error('Could not assign a unique quiz question order');
}
