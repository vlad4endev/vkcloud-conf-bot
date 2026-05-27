import { z } from 'zod';
import { SESSION_TRACKS } from '../scheduleTrack';

const sessionTrackSchema = z.enum(SESSION_TRACKS);

export const quizOptionSchema = z.enum(['a', 'b', 'c', 'd']);

export const speakerCreateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  profession: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(10000).optional().default(''),
  photoUrl: z.string().url().optional(),
  order: z.number().int().default(0),
});

export const speakerUpdateSchema = speakerCreateSchema.partial().extend({
  profession: z.string().trim().max(200).nullable().optional(),
});

export const speakerReorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        order: z.number().int(),
      }),
    )
    .min(1),
});

const scheduleTimeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format, expected HH:mm');

function scheduleTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export const scheduleCreateSchema = z
  .object({
    startTime: scheduleTimeSchema,
    endTime: scheduleTimeSchema,
    title: z.string().trim().min(1).max(300),
    description: z.string().trim().optional(),
    location: z.string().trim().max(200).optional(),
    speakerIds: z.array(z.string().trim().min(1)).optional(),
    speakerId: z.string().trim().min(1).optional(),
    track: sessionTrackSchema.optional(),
    order: z.number().int().optional(),
  })
  .refine(
    (data) => scheduleTimeToMinutes(data.endTime) > scheduleTimeToMinutes(data.startTime),
    {
      message: 'endTime must be after startTime',
      path: ['endTime'],
    },
  );

export const scheduleUpdateSchema = z
  .object({
    startTime: scheduleTimeSchema.optional(),
    endTime: scheduleTimeSchema.optional(),
    title: z.string().trim().min(1).max(300).optional(),
    description: z.string().trim().optional().nullable(),
    location: z.string().trim().max(200).optional().nullable(),
    speakerIds: z.array(z.string().trim().min(1)).optional(),
    speakerId: z.string().trim().min(1).optional().nullable(),
    track: sessionTrackSchema.optional(),
    order: z.number().int().optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return (
          scheduleTimeToMinutes(data.endTime) > scheduleTimeToMinutes(data.startTime)
        );
      }
      return true;
    },
    { message: 'endTime must be after startTime', path: ['endTime'] },
  );

export const scheduleReorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        order: z.number().int(),
      }),
    )
    .min(1),
});

export const quizQuestionCreateSchema = z.object({
  question: z.string().trim().min(1),
  optionA: z.string().trim().min(1),
  optionB: z.string().trim().min(1),
  optionC: z.string().trim().min(1),
  optionD: z.string().trim().min(1),
  correctOption: quizOptionSchema,
  order: z.number().int().optional(),
});

export const quizQuestionUpdateSchema = quizQuestionCreateSchema.partial();
