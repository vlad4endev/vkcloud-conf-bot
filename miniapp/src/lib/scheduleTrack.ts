export type SessionTrack = 'all' | 'tech' | 'business';

export const PARALLEL_TRACK_TABS: Array<{
  id: Exclude<SessionTrack, 'all'>;
  label: string;
}> = [
  { id: 'tech', label: 'Технологический трек' },
  { id: 'business', label: 'Бизнес-трек' },
];
