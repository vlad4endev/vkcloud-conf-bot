import type { Bot, Context } from '@maxhub/max-bot-api';
import { prisma } from '../../db/client';
import { formatHallLabel } from '../../shared/scheduleTrack';
import {
  chunkText,
  formatSessionDate,
  formatSessionTime,
} from '../lib/format';
import { ensureBotUser } from '../services/user';

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function registerProgramHandlers(bot: Bot): void {
  bot.command('program', async (ctx) => {
    await ensureBotUser(ctx);
    await sendProgram(ctx);
  });
}

export async function sendProgram(ctx: Context): Promise<void> {
  const sessions = await prisma.scheduleSession.findMany({
    orderBy: [{ startTime: 'asc' }, { order: 'asc' }],
    include: {
      sessionSpeakers: {
        orderBy: { order: 'asc' },
        include: { speaker: { select: { name: true } } },
      },
    },
  });

  if (sessions.length === 0) {
    await ctx.reply('Программа пока не опубликована. Загляните позже!');
    return;
  }

  const byDay = new Map<string, typeof sessions>();

  for (const session of sessions) {
    const key = dayKey(session.startTime);
    const list = byDay.get(key) ?? [];
    list.push(session);
    byDay.set(key, list);
  }

  let text = '📅 Программа VK Cloud Conf 2026\n\n';

  for (const [, daySessions] of byDay) {
    const first = daySessions[0]!;
    text += `${formatSessionDate(first.startTime)}\n`;

    for (const session of daySessions) {
      const time = `${formatSessionTime(session.startTime)}–${formatSessionTime(session.endTime)}`;
      const speakerNames = session.sessionSpeakers.map((link) => link.speaker.name);
      const speaker = speakerNames.length > 0 ? ` — ${speakerNames.join(', ')}` : '';
      const location = session.location
        ? ` (${formatHallLabel(session.location)})`
        : '';
      text += `\n${time}  ${session.title}${speaker}${location}`;
      if (session.description) {
        text += `\n   ${session.description}`;
      }
    }

    text += '\n';
  }

  const parts = chunkText(text.trim());
  for (const part of parts) {
    await ctx.reply(part);
  }
}
