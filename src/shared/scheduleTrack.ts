export const SESSION_TRACKS = ['all', 'tech', 'business'] as const;

export type SessionTrack = (typeof SESSION_TRACKS)[number];

export type ParallelTrack = Exclude<SessionTrack, 'all'>;

export type ParallelTrackInfo = {
  id: ParallelTrack;
  /** Основная подпись — название трека */
  title: string;
  /** Второстепенная подпись — физический зал */
  hall: string;
};

export const PARALLEL_TRACKS: ParallelTrackInfo[] = [
  { id: 'tech', title: 'Технический блок', hall: 'зал Rosewood' },
  { id: 'business', title: 'Бизнес-блок', hall: 'зал Main' },
];

/** @deprecated Используйте PARALLEL_TRACKS */
export const PARALLEL_TRACK_TABS = PARALLEL_TRACKS;

export const PARALLEL_TRACK_BY_ID: Record<ParallelTrack, ParallelTrackInfo> = {
  tech: PARALLEL_TRACKS[0]!,
  business: PARALLEL_TRACKS[1]!,
};

export const SESSION_TRACK_LABELS: Record<SessionTrack, string> = {
  all: 'Общий трек',
  tech: PARALLEL_TRACK_BY_ID.tech.title,
  business: PARALLEL_TRACK_BY_ID.business.title,
};

/** Старые подписи залов в БД → id трека */
const LOCATION_TO_TRACK: Record<string, ParallelTrack> = {
  'Технический блок': 'tech',
  'Бизнес-блок': 'business',
};

export function formatTrackHallText(track: ParallelTrack): string {
  const info = PARALLEL_TRACK_BY_ID[track];
  return `${info.title} · ${info.hall}`;
}

export function formatHallLabel(value: string): string {
  const trimmed = value.trim();
  const track = LOCATION_TO_TRACK[trimmed];
  if (track) {
    return formatTrackHallText(track);
  }
  return trimmed;
}
