import type { AppConfig } from '../api/client';
import { resolveQuizVisibility } from '../../../src/shared/quizVisibility';

export function isQuizVisibleInApp(config: AppConfig, nowMs = Date.now()): boolean {
  return resolveQuizVisibility(
    {
      manuallyEnabled: config.quiz_visible !== 'false',
      startAt: config.quiz_start_at?.trim() ? config.quiz_start_at : null,
    },
    nowMs,
  ).sectionVisible;
}

export function isQuizHiddenInApp(config: AppConfig, nowMs = Date.now()): boolean {
  return !isQuizVisibleInApp(config, nowMs);
}
