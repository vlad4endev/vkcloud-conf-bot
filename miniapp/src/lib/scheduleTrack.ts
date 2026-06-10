export type SessionTrack = 'all' | 'tech' | 'business';

export type ParallelTrack = Exclude<SessionTrack, 'all'>;

export {
  PARALLEL_TRACKS,
  PARALLEL_TRACK_TABS,
  PARALLEL_TRACK_BY_ID,
  formatHallLabel,
  formatTrackHallText,
} from '../../../src/shared/scheduleTrack';
