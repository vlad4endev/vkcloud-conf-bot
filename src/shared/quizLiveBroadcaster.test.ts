import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import type { QuizLiveState } from './quizLiveState';
import {
  invalidateQuizLiveCache,
  refreshQuizLiveState,
  resetQuizLiveBroadcasterForTests,
  setQuizLiveStateFetcherForTests,
  subscribe,
} from './quizLiveBroadcaster';

const baseState: QuizLiveState = {
  revision: 'rev-1',
  sectionVisible: true,
  questionsCount: 3,
  awaitingSchedule: false,
  startsAtMs: null,
};

describe('quizLiveBroadcaster', () => {
  afterEach(() => {
    resetQuizLiveBroadcasterForTests();
  });

  it('fans out updates to all subscribers', async () => {
    let fetchCount = 0;
    setQuizLiveStateFetcherForTests(async () => {
      fetchCount += 1;
      return baseState;
    });

    const messages: string[] = [];
    const unsubscribeA = subscribe((chunk) => {
      messages.push(chunk);
    });
    const messagesB: string[] = [];
    const unsubscribeB = subscribe((chunk) => {
      messagesB.push(chunk);
    });

    await refreshQuizLiveState();

    assert.equal(fetchCount, 1);
    assert.equal(messages.length, 1);
    assert.equal(messagesB.length, 1);
    assert.match(messages[0]!, /"revision":"rev-1"/);

    unsubscribeA();
    unsubscribeB();
  });

  it('skips fan-out when serialized payload is unchanged', async () => {
    let fetchCount = 0;
    setQuizLiveStateFetcherForTests(async () => {
      fetchCount += 1;
      return baseState;
    });

    const messages: string[] = [];
    const unsubscribe = subscribe((chunk) => {
      messages.push(chunk);
    });

    await refreshQuizLiveState();
    await refreshQuizLiveState();

    assert.equal(fetchCount, 2);
    assert.equal(messages.length, 1);

    unsubscribe();
  });

  it('forces fan-out after invalidateQuizLiveCache', async () => {
    let fetchCount = 0;
    setQuizLiveStateFetcherForTests(async () => {
      fetchCount += 1;
      return baseState;
    });

    const messages: string[] = [];
    const unsubscribe = subscribe((chunk) => {
      messages.push(chunk);
    });

    await refreshQuizLiveState();
    invalidateQuizLiveCache();
    await refreshQuizLiveState();

    assert.equal(fetchCount, 2);
    assert.equal(messages.length, 2);

    unsubscribe();
  });
});
