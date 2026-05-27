import type { Prisma } from '@prisma/client';

export const scheduleSessionInclude = {
  sessionSpeakers: {
    orderBy: { order: 'asc' as const },
    include: {
      speaker: {
        select: {
          id: true,
          name: true,
          profession: true,
          photoUrl: true,
        },
      },
    },
  },
} satisfies Prisma.ScheduleSessionInclude;

type SessionWithSpeakers = Prisma.ScheduleSessionGetPayload<{
  include: typeof scheduleSessionInclude;
}>;

export type ScheduleSessionSpeakerDto = {
  id: string;
  name: string;
  profession: string | null;
  photoUrl: string | null;
  order: number;
};

export function serializeScheduleSession(session: SessionWithSpeakers) {
  const { sessionSpeakers, ...rest } = session;

  return {
    ...rest,
    speakers: sessionSpeakers.map((link) => ({
      id: link.speaker.id,
      name: link.speaker.name,
      profession: link.speaker.profession,
      photoUrl: link.speaker.photoUrl,
      order: link.order,
    })),
  };
}

export function serializeScheduleSessions(sessions: SessionWithSpeakers[]) {
  return sessions.map(serializeScheduleSession);
}

export function buildSessionSpeakersCreate(speakerIds: string[] | undefined) {
  if (!speakerIds?.length) {
    return undefined;
  }

  return {
    create: speakerIds.map((speakerId, order) => ({ speakerId, order })),
  };
}

/** Supports legacy `speaker` / `speakerId` from older API responses. */
export function resolveSessionSpeakerIds(input: {
  speakerIds?: string[];
  speakerId?: string | null;
}): string[] | undefined {
  if (input.speakerIds !== undefined) {
    return input.speakerIds;
  }
  if (input.speakerId) {
    return [input.speakerId];
  }
  if (input.speakerId === null) {
    return [];
  }
  return undefined;
}

type LegacySpeaker = {
  id: string;
  name: string;
  profession?: string | null;
  photoUrl?: string | null;
};

export type SerializedScheduleSession = ReturnType<typeof serializeScheduleSession>;

type NormalizableSession = SerializedScheduleSession & {
  speaker?: LegacySpeaker | null;
  speakerId?: string | null;
};

export function normalizeScheduleSession(session: NormalizableSession): SerializedScheduleSession {
  const speakers = session.speakers?.length
    ? session.speakers
    : session.speaker
      ? [
          {
            id: session.speaker.id,
            name: session.speaker.name,
            profession: session.speaker.profession ?? null,
            photoUrl: session.speaker.photoUrl ?? null,
            order: 0,
          },
        ]
      : [];

  const { speaker: _speaker, speakerId: _speakerId, ...rest } = session;

  return {
    ...rest,
    track: rest.track ?? 'all',
    speakers,
  };
}
