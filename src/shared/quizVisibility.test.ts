import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatQuizStartAtForInput,
  parseQuizStartAtFromInput,
  resolveQuizVisibility,
} from './quizVisibility';

describe('quizVisibility', () => {
  it('hides quiz before scheduled start when manually enabled', () => {
    const startAt = '2026-06-17T05:00:00.000Z';
    const before = resolveQuizVisibility(
      { manuallyEnabled: true, startAt },
      Date.parse('2026-06-17T04:59:00.000Z'),
    );
    const after = resolveQuizVisibility(
      { manuallyEnabled: true, startAt },
      Date.parse('2026-06-17T05:00:00.000Z'),
    );

    assert.equal(before.sectionVisible, false);
    assert.equal(before.awaitingSchedule, true);
    assert.equal(after.sectionVisible, true);
    assert.equal(after.awaitingSchedule, false);
  });

  it('keeps quiz hidden when manually disabled even after start time', () => {
    const state = resolveQuizVisibility(
      { manuallyEnabled: false, startAt: '2026-06-17T05:00:00.000Z' },
      Date.parse('2026-06-17T06:00:00.000Z'),
    );

    assert.equal(state.sectionVisible, false);
    assert.equal(state.awaitingSchedule, false);
  });

  it('round-trips Moscow datetime-local input', () => {
    const iso = parseQuizStartAtFromInput('2026-06-17T08:00');
    assert.ok(iso);
    assert.equal(formatQuizStartAtForInput(iso), '2026-06-17T08:00');
  });
});
