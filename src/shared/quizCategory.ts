export const DEFAULT_QUIZ_CATEGORY = 'Общее';

export type QuizQuestionWithCategory = {
  id: string;
  category: string;
  order: number;
};

export type QuizCategoryGroup<T extends QuizQuestionWithCategory> = {
  category: string;
  questions: T[];
};

export type QuizCategoryProgress = {
  category: string;
  total: number;
  answered: number;
};

export function normalizeQuizCategory(category?: string | null): string {
  const trimmed = category?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_QUIZ_CATEGORY;
}

export function sortQuizQuestions<T extends QuizQuestionWithCategory>(
  questions: readonly T[],
): T[] {
  return [...questions].sort((left, right) => {
    const categoryCompare = normalizeQuizCategory(left.category).localeCompare(
      normalizeQuizCategory(right.category),
      'ru',
    );
    if (categoryCompare !== 0) {
      return categoryCompare;
    }

    return left.order - right.order;
  });
}

export function groupQuizQuestionsByCategory<T extends QuizQuestionWithCategory>(
  questions: readonly T[],
): QuizCategoryGroup<T>[] {
  const groups: QuizCategoryGroup<T>[] = [];

  for (const question of sortQuizQuestions(questions)) {
    const category = normalizeQuizCategory(question.category);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.category === category) {
      lastGroup.questions.push(question);
      continue;
    }

    groups.push({ category, questions: [question] });
  }

  return groups;
}

export function countAnsweredInCategory(
  questions: readonly QuizQuestionWithCategory[],
  answeredIds: ReadonlySet<string>,
): QuizCategoryProgress[] {
  return groupQuizQuestionsByCategory(questions).map((group) => ({
    category: group.category,
    total: group.questions.length,
    answered: group.questions.filter((question) => answeredIds.has(question.id))
      .length,
  }));
}
