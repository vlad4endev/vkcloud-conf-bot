/** Anchor date for schedule slots (time-of-day only; stored/read in UTC). */
const SCHEDULE_YEAR = 2026;
const SCHEDULE_MONTH = 5; // June (0-based)
const SCHEDULE_DAY = 1;

/** "10:00" → Date at 10:00 UTC on the anchor day. */
export function scheduleTimeToDate(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(Date.UTC(SCHEDULE_YEAR, SCHEDULE_MONTH, SCHEDULE_DAY, hours, minutes, 0, 0));
}

/** Date from DB → "HH:mm" in UTC (no local timezone shift). */
export function formatScheduleTime(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  const hours = String(value.getUTCHours()).padStart(2, '0');
  const minutes = String(value.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function scheduleTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
