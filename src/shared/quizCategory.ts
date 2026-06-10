export const DEFAULT_QUIZ_CATEGORY = 'Общее';

export function normalizeQuizCategory(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : DEFAULT_QUIZ_CATEGORY;
}

export type QuizCategoryGroup<T extends { category: string; order: number }> = {
  category: string;
  questions: T[];
  totalCount: number;
};

export function sortQuizQuestions<T extends { category: string; order: number }>(
  questions: readonly T[],
): T[] {
  return [...questions].sort((left, right) => {
    const byCategory = normalizeQuizCategory(left.category).localeCompare(
      normalizeQuizCategory(right.category),
      'ru',
    );
    if (byCategory !== 0) {
      return byCategory;
    }
    return left.order - right.order;
  });
}

export function groupQuizQuestionsByCategory<T extends { category: string; order: number }>(
  questions: readonly T[],
): QuizCategoryGroup<T>[] {
  const groups = new Map<string, T[]>();

  for (const question of sortQuizQuestions(questions)) {
    const category = normalizeQuizCategory(question.category);
    const bucket = groups.get(category);
    if (bucket) {
      bucket.push(question);
    } else {
      groups.set(category, [question]);
    }
  }

  return [...groups.entries()].map(([category, bucket]) => ({
    category,
    questions: bucket,
    totalCount: bucket.length,
  }));
}

export function countAnsweredInCategory<T extends { id: string }>(
  questions: readonly T[],
  answeredIds: ReadonlySet<string>,
): number {
  return questions.reduce(
    (count, question) => (answeredIds.has(question.id) ? count + 1 : count),
    0,
  );
}
