import type { Weekday } from '@dayli/schema';

export const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isLocalDate(s: string | null | undefined): s is string {
  if (!s) return false;
  const m = DATE_RE.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!));
  return d.getUTCFullYear() === +m[1]! && d.getUTCMonth() === +m[2]! - 1 && d.getUTCDate() === +m[3]!;
}

export function isLocalTime(s: string | null | undefined): s is string {
  return !!s && TIME_RE.test(s);
}

/** Days since 1970-01-01 for a YYYY-MM-DD string. */
export function dayNumber(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Math.round(Date.UTC(y!, m! - 1, d!) / 86_400_000);
}

export function fromDayNumber(n: number): string {
  return new Date(n * 86_400_000).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return fromDayNumber(dayNumber(date) + days);
}

export function diffDays(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from);
}

export function weekdayOf(date: string): Weekday {
  // 1970-01-01 was a Thursday.
  const idx = (((dayNumber(date) + 3) % 7) + 7) % 7; // 0 = mon
  return WEEKDAYS[idx]!;
}

/** The 7 dates of the week containing `date`, starting Monday. */
export function weekOf(date: string): string[] {
  const start = addDays(date, -WEEKDAYS.indexOf(weekdayOf(date)));
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h! * 60 + m!;
}

/** Local date (YYYY-MM-DD) and time (HH:mm) for a JS Date in the runtime's timezone. */
export function localParts(d: Date): { date: string; time: string } {
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** "4:00 pm", or "4 pm" with `compact`. */
export function formatTime(time: string, compact = false): string {
  const mins = toMinutes(time);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h24 < 12 ? 'am' : 'pm';
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  if (compact && m === 0) return `${h} ${suffix}`;
  return `${h}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** "4–10 pm", "11 am–5 pm", "9:30–10:45 am". */
export function formatRange(start: string, end: string): string {
  const s = formatTime(start, true);
  const e = formatTime(end, true);
  const sSuffix = s.slice(-2);
  if (sSuffix === e.slice(-2)) return `${s.slice(0, -3)}–${e}`;
  return `${s}–${e}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function monthDay(date: string): string {
  const [, m, d] = date.split('-').map(Number);
  return `${MONTHS[m! - 1]} ${d}`;
}

export function weekdayLong(date: string): string {
  return WEEKDAY_LONG[WEEKDAYS.indexOf(weekdayOf(date))]!;
}

export function weekdayShort(date: string): string {
  return weekdayOf(date).charAt(0).toUpperCase() + weekdayOf(date).slice(1);
}

/** "today", "tomorrow", "in 3 days", "yesterday", "2 days ago". */
export function relativeDay(today: string, date: string): string {
  const n = diffDays(today, date);
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n === -1) return 'yesterday';
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}
