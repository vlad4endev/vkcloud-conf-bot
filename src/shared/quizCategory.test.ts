import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  countAnsweredInCategory,
  groupQuizQuestionsByCategory,
  normalizeQuizCategory,
  sortQuizQuestions,
} from './quizCategory';

const QUESTIONS = [
  { id: 'q2', category: 'Б', order: 1 },
  { id: 'q1', category: 'А', order: 2 },
  { id: 'q3', category: 'А', order: 3 },
] as const;

describe('quizCategory', () => {
  it('normalizes empty category to default', () => {
    assert.equal(normalizeQuizCategory(undefined), 'Общее');
    assert.equal(normalizeQuizCategory('   '), 'Общее');
    assert.equal(normalizeQuizCategory('  VK Cloud  '), 'VK Cloud');
  });

  it('sorts questions by category then order', () => {
    assert.deepEqual(
      sortQuizQuestions(QUESTIONS).map((question) => question.id),
      ['q1', 'q3', 'q2'],
    );
  });

  it('groups questions by category', () => {
    assert.deepEqual(groupQuizQuestionsByCategory(QUESTIONS), [
      { category: 'А', questions: [QUESTIONS[1], QUESTIONS[2]] },
      { category: 'Б', questions: [QUESTIONS[0]] },
    ]);
  });

  it('counts answered questions per category', () => {
    assert.deepEqual(
      countAnsweredInCategory(QUESTIONS, new Set(['q1'])),
      [
        { category: 'А', total: 2, answered: 1, isComplete: false },
        { category: 'Б', total: 1, answered: 0, isComplete: false },
      ],
    );
    assert.deepEqual(
      countAnsweredInCategory(QUESTIONS, new Set(['q1', 'q3'])),
      [
        { category: 'А', total: 2, answered: 2, isComplete: true },
        { category: 'Б', total: 1, answered: 0, isComplete: false },
      ],
    );
  });

  it('treats missing category as default when sorting', () => {
    assert.doesNotThrow(() => {
      sortQuizQuestions([
        { id: 'q1', category: '', order: 2 },
        { id: 'q2', category: 'VK Cloud', order: 1 },
      ]);
    });
    assert.deepEqual(
      groupQuizQuestionsByCategory([{ id: 'q1', category: '', order: 1 }]),
      [{ category: 'Общее', questions: [{ id: 'q1', category: '', order: 1 }] }],
    );
  });
});
