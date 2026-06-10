export const SESSION_TRACKS = ['all', 'tech', 'business'] as const;

export type SessionTrack = (typeof SESSION_TRACKS)[number];

export const SESSION_TRACK_LABELS: Record<SessionTrack, string> = {
  all: 'Общий трек',
  tech: 'зал Rosewood',
  business: 'зал MAIN',
};

export const PARALLEL_TRACK_TABS: Array<{ id: Exclude<SessionTrack, 'all'>; label: string }> =
  [
    { id: 'tech', label: 'зал Rosewood' },
    { id: 'business', label: 'зал MAIN' },
  ];

/** Старые подписи залов в БД → актуальное отображение */
export const HALL_LABEL_OVERRIDES: Record<string, string> = {
  'Технический блок': 'зал Rosewood',
  'Бизнес-блок': 'зал MAIN',
};

export function formatHallLabel(value: string): string {
  const trimmed = value.trim();
  return HALL_LABEL_OVERRIDES[trimmed] ?? trimmed;
}
