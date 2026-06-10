import type { QuizQuestion } from '../api/types';

export type QuizCategoryGroup = {
  category: string;
  questions: QuizQuestion[];
};

export function groupQuizQuestionsByCategory(
  questions: QuizQuestion[],
): QuizCategoryGroup[] {
  const sorted = [...questions].sort((left, right) => {
    const categoryCompare = left.category.localeCompare(right.category, 'ru');
    if (categoryCompare !== 0) {
      return categoryCompare;
    }

    return left.order - right.order;
  });

  const groups: QuizCategoryGroup[] = [];

  for (const question of sorted) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.category === question.category) {
      lastGroup.questions.push(question);
      continue;
    }

    groups.push({ category: question.category, questions: [question] });
  }

  return groups;
}
