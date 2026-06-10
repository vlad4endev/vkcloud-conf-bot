import { prisma } from '../db/client';
import { getCachedTotalQuestions } from './miniappCache';

export type UserQuizStatus = {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  isComplete: boolean;
  isWinner: boolean;
  answeredQuestionIds: string[];
};

export function isQuizComplete(
  answeredQuestions: number,
  totalQuestions: number,
): boolean {
  return totalQuestions > 0 && answeredQuestions >= totalQuestions;
}

export function isQuizWinner(
  answeredQuestions: number,
  correctAnswers: number,
  totalQuestions: number,
): boolean {
  return (
    isQuizComplete(answeredQuestions, totalQuestions) &&
    correctAnswers === totalQuestions
  );
}

export function buildQuizStatus(
  totalQuestions: number,
  results: Array<{ questionId: string; isCorrect: boolean }>,
): UserQuizStatus {
  const answeredQuestionIds = results.map((row) => row.questionId);
  const answeredQuestions = results.length;
  const correctAnswers = results.filter((row) => row.isCorrect).length;
  const isComplete = isQuizComplete(answeredQuestions, totalQuestions);
  const isWinner = isQuizWinner(
    answeredQuestions,
    correctAnswers,
    totalQuestions,
  );

  return {
    totalQuestions,
    answeredQuestions,
    correctAnswers,
    isComplete,
    isWinner,
    answeredQuestionIds,
  };
}

export async function getUserQuizStatus(userId: string): Promise<UserQuizStatus> {
  const [totalQuestions, results] = await Promise.all([
    getCachedTotalQuestions(),
    prisma.quizResult.findMany({
      where: { userId },
      select: { questionId: true, isCorrect: true },
    }),
  ]);

  return buildQuizStatus(totalQuestions, results);
}

export type QuizParticipantRow = {
  userId: string;
  fullName: string;
  email: string;
  answeredQuestions: number;
  correctAnswers: number;
  totalQuestions: number;
  isComplete: boolean;
  isWinner: boolean;
  completedAt: Date | null;
};
