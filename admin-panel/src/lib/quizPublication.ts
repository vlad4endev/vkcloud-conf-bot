export type QuizPublicationMode = 'hidden' | 'now' | 'scheduled';

const QUIZ_DISPLAY_TIMEZONE = 'Europe/Moscow';

export function getQuizPublicationMode(state: {
  manuallyEnabled: boolean;
  startAt: string | null;
}): QuizPublicationMode {
  if (!state.manuallyEnabled) {
    return 'hidden';
  }
  if (state.startAt) {
    return 'scheduled';
  }
  return 'now';
}

export function formatQuizStartAtForDisplay(iso: string | null): string {
  if (!iso) {
    return '';
  }

  return new Date(iso).toLocaleString('ru-RU', {
    timeZone: QUIZ_DISPLAY_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatQuizStartAtForInput(iso: string | null): string {
  if (!iso) {
    return '';
  }

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: QUIZ_DISPLAY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));

  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

export function parseQuizStartAtFromInput(localValue: string): string | null {
  const trimmed = localValue.trim();
  if (!trimmed) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return null;
  }

  const ms = Date.parse(`${trimmed}:00+03:00`);
  if (Number.isNaN(ms)) {
    return null;
  }

  return new Date(ms).toISOString();
}

export function formatCountdownToStart(startsAtMs: number, nowMs: number = Date.now()): string {
  const diffMs = Math.max(0, startsAtMs - nowMs);
  const totalMinutes = Math.ceil(diffMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days} д ${hours} ч`;
  }
  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  }
  return `${minutes} мин`;
}
