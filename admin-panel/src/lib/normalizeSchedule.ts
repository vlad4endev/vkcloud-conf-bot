import type { ScheduleSession, ScheduleSessionSpeaker } from '../api/types';

type LegacyScheduleSession = ScheduleSession & {
  speaker?: Pick<ScheduleSessionSpeaker, 'id' | 'name' | 'profession' | 'photoUrl'> | null;
  speakerId?: string | null;
};

export function normalizeScheduleSession(raw: LegacyScheduleSession): ScheduleSession {
  const speakers = raw.speakers?.length
    ? raw.speakers
    : raw.speaker
      ? [
          {
            id: raw.speaker.id,
            name: raw.speaker.name,
            profession: raw.speaker.profession ?? null,
            photoUrl: raw.speaker.photoUrl ?? null,
            order: 0,
          },
        ]
      : [];

  return {
    ...raw,
    track: raw.track ?? 'all',
    speakers,
  };
}
