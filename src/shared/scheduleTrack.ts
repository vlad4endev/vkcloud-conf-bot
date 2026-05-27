export const SESSION_TRACKS = ['all', 'tech', 'business'] as const;

export type SessionTrack = (typeof SESSION_TRACKS)[number];

export const SESSION_TRACK_LABELS: Record<SessionTrack, string> = {
  all: 'Общий трек',
  tech: 'Технологический трек',
  business: 'Бизнес-трек',
};

export const PARALLEL_TRACK_TABS: Array<{ id: Exclude<SessionTrack, 'all'>; label: string }> =
  [
    { id: 'tech', label: 'Технологический трек' },
    { id: 'business', label: 'Бизнес-трек' },
  ];
