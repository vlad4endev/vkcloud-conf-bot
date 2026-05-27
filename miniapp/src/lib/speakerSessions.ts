import type { SpeakerSession } from '../api/client';
import { formatScheduleTime } from './scheduleFormat';

export function formatSpeakerSessionLine(session: SpeakerSession): string {
  const start = formatScheduleTime(session.startTime);
  const end = formatScheduleTime(session.endTime);
  return `${start}–${end} · ${session.title}`;
}

export function formatSpeakerSessionsSummary(sessions: SpeakerSession[]): string {
  return sessions.map(formatSpeakerSessionLine).join('\n');
}
