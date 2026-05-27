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
