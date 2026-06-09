import { prisma } from '../db/client';

/** Next display_order so new questions appear at the end of the admin list. */
export async function getNextQuizQuestionOrder(): Promise<number> {
  const { _max } = await prisma.quizQuestion.aggregate({
    _max: { order: true },
  });

  return (_max.order ?? -1) + 1;
}
