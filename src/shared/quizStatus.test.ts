import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildQuizStatus,
  isQuizComplete,
  isQuizWinner,
} from './quizStatus';

describe('quizStatus', () => {
  it('marks quiz complete only when all questions are answered', () => {
    assert.equal(isQuizComplete(2, 3), false);
    assert.equal(isQuizComplete(3, 3), true);
    assert.equal(isQuizComplete(0, 0), false);
  });

  it('marks winner only with a perfect score on a complete quiz', () => {
    assert.equal(isQuizWinner(3, 3, 3), true);
    assert.equal(isQuizWinner(3, 2, 3), false);
    assert.equal(isQuizWinner(2, 2, 3), false);
  });

  it('builds status with answered question ids', () => {
    const status = buildQuizStatus(3, [
      { questionId: 'q1', isCorrect: true },
      { questionId: 'q2', isCorrect: false },
    ]);

    assert.deepEqual(status.answeredQuestionIds, ['q1', 'q2']);
    assert.equal(status.answeredQuestions, 2);
    assert.equal(status.correctAnswers, 1);
    assert.equal(status.isComplete, false);
    assert.equal(status.isWinner, false);
  });
});
