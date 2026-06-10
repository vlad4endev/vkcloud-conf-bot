import type { QuizQuestion, QuizStatus } from '../api/client';
import { sortQuizQuestions } from '../../../src/shared/quizCategory';

export {
  groupQuizQuestionsByCategory,
  countAnsweredInCategory,
  normalizeQuizCategory,
} from '../../../src/shared/quizCategory';

export function toAnsweredSet(answeredQuestionIds: string[]): Set<string> {
  return new Set(answeredQuestionIds);
}

export function findNextQuestion(
  questions: QuizQuestion[],
  answeredIds: ReadonlySet<string>,
): QuizQuestion | null {
  const sorted = sortQuizQuestions(questions);
  return sorted.find((question) => !answeredIds.has(question.id)) ?? null;
}

export function applyAnswerToQuizStatus(
  status: QuizStatus,
  questionId: string,
  isCorrect: boolean,
): QuizStatus {
  if (status.answeredQuestionIds.includes(questionId)) {
    return status;
  }

  const answeredQuestions = status.answeredQuestions + 1;
  const correctAnswers = status.correctAnswers + (isCorrect ? 1 : 0);
  const totalQuestions = status.totalQuestions;
  const isComplete =
    totalQuestions > 0 && answeredQuestions >= totalQuestions;
  const isWinner = isComplete && correctAnswers === totalQuestions;

  return {
    totalQuestions,
    answeredQuestions,
    correctAnswers,
    isComplete,
    isWinner,
    answeredQuestionIds: [...status.answeredQuestionIds, questionId],
  };
}
