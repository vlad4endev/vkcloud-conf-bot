import type { Prisma } from '@prisma/client';

export const speakerWithSessionsInclude = {
  sessionSpeakers: {
    orderBy: { order: 'asc' as const },
    include: {
      session: {
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  },
} satisfies Prisma.SpeakerInclude;

type SpeakerWithSessions = Prisma.SpeakerGetPayload<{
  include: typeof speakerWithSessionsInclude;
}>;

export type SpeakerSessionDto = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
};

export type SpeakerDto = {
  id: string;
  name: string;
  profession: string | null;
  photoUrl: string | null;
  order: number;
  sessions: SpeakerSessionDto[];
};

export function serializeSpeaker(speaker: SpeakerWithSessions): SpeakerDto {
  const sessions = speaker.sessionSpeakers
    .map((link) => ({
      id: link.session.id,
      title: link.session.title,
      startTime: link.session.startTime.toISOString(),
      endTime: link.session.endTime.toISOString(),
    }))
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  return {
    id: speaker.id,
    name: speaker.name,
    profession: speaker.profession,
    photoUrl: speaker.photoUrl,
    order: speaker.order,
    sessions,
  };
}

export function serializeSpeakers(speakers: SpeakerWithSessions[]): SpeakerDto[] {
  return speakers.map(serializeSpeaker);
}
