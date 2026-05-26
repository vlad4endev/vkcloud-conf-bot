export const QUIZ_MEDALS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export type QuizResultRow = {
  userId: string;
  fullName: string;
  email: string;
  correctAnswers: number;
  totalQuestions: number;
};

export type RankedQuizResult = QuizResultRow & {
  rank: number;
  medal: string | null;
  isPerfect: boolean;
};

export const QUIZ_RANK_ROW_CLASS: Record<number, string> = {
  1: 'bg-amber-500/10',
  2: 'bg-slate-400/10',
  3: 'bg-orange-600/10',
};

/** Сортирует по баллам и присваивает места (при равном счёте — одно место). */
export function rankQuizResults(results: QuizResultRow[]): RankedQuizResult[] {
  const sorted = [...results].sort((a, b) => {
    if (b.correctAnswers !== a.correctAnswers) {
      return b.correctAnswers - a.correctAnswers;
    }
    return a.fullName.localeCompare(b.fullName, 'ru');
  });

  let rank = 0;
  let prevScore: number | null = null;

  return sorted.map((row, index) => {
    if (prevScore === null || row.correctAnswers < prevScore) {
      rank = index + 1;
      prevScore = row.correctAnswers;
    }

    const isPerfect =
      row.totalQuestions > 0 && row.correctAnswers === row.totalQuestions;

    return {
      ...row,
      rank,
      medal: QUIZ_MEDALS[rank] ?? null,
      isPerfect,
    };
  });
}
