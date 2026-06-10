import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { QuizQuestion, QuizStatus } from '../api/client';
import {
  applyAnswerToQuizStatus,
  findNextQuestion,
  toAnsweredSet,
} from './quizFlow';

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'q2',
    category: 'Б',
    question: 'Two',
    optionA: 'A',
    optionB: 'B',
    optionC: 'C',
    optionD: 'D',
    order: 1,
  },
  {
    id: 'q1',
    category: 'А',
    question: 'One',
    optionA: 'A',
    optionB: 'B',
    optionC: 'C',
    optionD: 'D',
    order: 2,
  },
  {
    id: 'q3',
    category: 'А',
    question: 'Three',
    optionA: 'A',
    optionB: 'B',
    optionC: 'C',
    optionD: 'D',
    order: 3,
  },
];

const INITIAL_STATUS: QuizStatus = {
  totalQuestions: 3,
  answeredQuestions: 0,
  correctAnswers: 0,
  isComplete: false,
  isWinner: false,
  answeredQuestionIds: [],
};

describe('quizFlow', () => {
  it('finds the first unanswered question by category then order', () => {
    assert.equal(findNextQuestion(QUESTIONS, new Set())?.id, 'q1');
    assert.equal(findNextQuestion(QUESTIONS, toAnsweredSet(['q1']))?.id, 'q3');
    assert.equal(findNextQuestion(QUESTIONS, toAnsweredSet(['q1', 'q3']))?.id, 'q2');
    assert.equal(findNextQuestion(QUESTIONS, toAnsweredSet(['q1', 'q2', 'q3'])), null);
  });

  it('advances quiz status after each answer without dropping to idle', () => {
    const afterFirst = applyAnswerToQuizStatus(INITIAL_STATUS, 'q1', true);
    assert.equal(afterFirst.answeredQuestions, 1);
    assert.equal(afterFirst.isComplete, false);

    const afterSecond = applyAnswerToQuizStatus(afterFirst, 'q2', false);
    assert.equal(afterSecond.answeredQuestions, 2);
    assert.equal(afterSecond.correctAnswers, 1);

    const afterThird = applyAnswerToQuizStatus(afterSecond, 'q3', true);
    assert.equal(afterThird.isComplete, true);
    assert.equal(afterThird.isWinner, false);
  });

  it('does not duplicate answers in status', () => {
    const once = applyAnswerToQuizStatus(INITIAL_STATUS, 'q1', true);
    const twice = applyAnswerToQuizStatus(once, 'q1', true);
    assert.deepEqual(twice, once);
  });
});
