export type SessionTrack = 'all' | 'tech' | 'business';

export const PARALLEL_TRACK_TABS: Array<{
  id: Exclude<SessionTrack, 'all'>;
  label: string;
}> = [
  { id: 'tech', label: 'зал Rosewood' },
  { id: 'business', label: 'зал MAIN' },
];

export { formatHallLabel } from '../../../src/shared/scheduleTrack';
