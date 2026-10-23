import type { Weekday } from '@dayli/schema';
import { dateLocale, type TermSystem } from './locale';

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

/** "4:00 pm", or "4 pm" with `compact`; "16:00" on a 24-hour clock, compact or not. */
export function formatTime(time: string, compact = false): string {
  const mins = toMinutes(time);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  if (!dateLocale().hour12) return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const suffix = h24 < 12 ? 'am' : 'pm';
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  if (compact && m === 0) return `${h} ${suffix}`;
  return `${h}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** "4–10 pm", "11 am–5 pm", "9:30–10:45 am"; "16:00–22:00" on a 24-hour clock. */
export function formatRange(start: string, end: string): string {
  const s = formatTime(start, true);
  const e = formatTime(end, true);
  if (!dateLocale().hour12) return `${s}–${e}`;
  const sSuffix = s.slice(-2);
  if (sSuffix === e.slice(-2)) return `${s.slice(0, -3)}–${e}`;
  return `${s}–${e}`;
}

/** The hour as the clock reads it, without minutes: "4 pm", or "16" on a 24-hour clock. */
export function formatHour(h24: number): string {
  if (!dateLocale().hour12) return String(h24 % 24).padStart(2, '0');
  return `${h24 % 12 || 12} ${h24 % 24 < 12 ? 'am' : 'pm'}`;
}

/** "9:00" without its period; "21:00" on a 24-hour clock. Pairs with `clockPeriod`. */
export function clockTime(time: string): string {
  if (!dateLocale().hour12) return time;
  const [h, m] = time.split(':').map(Number);
  return `${h! % 12 === 0 ? 12 : h! % 12}:${String(m).padStart(2, '0')}`;
}

/** "am" or "pm" for `clockTime`; nothing on a 24-hour clock. */
export function clockPeriod(time: string): string {
  if (!dateLocale().hour12) return '';
  return Number(time.split(':')[0]) >= 12 ? 'pm' : 'am';
}

/** "45m", "2h 05m": a countdown in minutes, never negative. */
export function hoursMinutes(mins: number): string {
  const m = Math.max(0, Math.round(mins));
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

/** Minutes from start to end; an end before its start runs past midnight. No end, or none apart, is 0. */
export function spanMinutes(start: string | null | undefined, end: string | null | undefined): number {
  if (!start || !end) return 0;
  const n = toMinutes(end) - toMinutes(start);
  return n < 0 ? n + 1440 : n;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** "Oct 24", or "24 Oct" where the day comes first. */
export function monthDay(date: string): string {
  const [, m, d] = date.split('-').map(Number);
  return dateLocale().dayFirst ? `${d} ${MONTHS[m! - 1]}` : `${MONTHS[m! - 1]} ${d}`;
}

const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "October": the month of a date or ISO timestamp. */
export function monthName(date: string): string {
  return MONTHS_LONG[Number(date.slice(5, 7)) - 1]!;
}

/** "October 24", or "24 October" where the day comes first. */
export function longMonthDay(date: string): string {
  const [, m, d] = date.split('-').map(Number);
  return dateLocale().dayFirst ? `${d} ${MONTHS_LONG[m! - 1]}` : `${MONTHS_LONG[m! - 1]} ${d}`;
}

/** "Oct 24, 2026", or "24 Oct 2026" where the day comes first. */
export function fullDate(date: string): string {
  const year = date.slice(0, 4);
  return dateLocale().dayFirst ? `${monthDay(date)} ${year}` : `${monthDay(date)}, ${year}`;
}

export function weekdayLong(date: string): string {
  return WEEKDAY_LONG[WEEKDAYS.indexOf(weekdayOf(date))]!;
}

export function weekdayShort(date: string): string {
  return weekdayOf(date).charAt(0).toUpperCase() + weekdayOf(date).slice(1);
}

/** Sentence-case date labels: "Today", "Tomorrow", "In 3 days", "Yesterday", "2 days ago". */
export function relativeDay(today: string, date: string): string {
  const n = diffDays(today, date);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  return n > 0 ? `In ${n} days` : `${-n} days ago`;
}

export type Term = 'fall' | 'winter' | 'spring' | 'summer' | 'autumn' | 'first' | 'second';

/** A term in a regional calendar: it ends on the Friday on or before `month`/`day`. */
type TermEnd = { month: number; day: number; term: Term; name: string };

const US_SEMESTERS: TermEnd[] = [
  { month: 5, day: 14, term: 'spring', name: 'spring semester' },
  { month: 8, day: 7, term: 'summer', name: 'summer session' },
  { month: 12, day: 14, term: 'fall', name: 'fall semester' },
];
const US_QUARTERS: TermEnd[] = [
  { month: 3, day: 20, term: 'winter', name: 'winter quarter' },
  { month: 6, day: 12, term: 'spring', name: 'spring quarter' },
  { month: 8, day: 21, term: 'summer', name: 'summer session' },
  { month: 12, day: 12, term: 'fall', name: 'fall quarter' },
];
const TWO_SEMESTERS = (first: [number, number], second: [number, number], names: [Term, string, Term, string]): TermEnd[] => [
  { month: first[0], day: first[1], term: names[0], name: names[1] },
  { month: second[0], day: second[1], term: names[2], name: names[3] },
];

/**
 * When classes stop in each region, as the Friday on or before a date. Teaching ends, not exams:
 * a repeating class is what this ends. Sources are the published calendars of the largest
 * universities in each country; individual schools move by a week or two, and the review sheet
 * always shows the guess so the person can change it.
 */
const CALENDARS: Record<string, TermEnd[]> = {
  US: US_SEMESTERS,
  // Canada: fall classes end early December, winter early April, summer late July.
  CA: [
    { month: 4, day: 11, term: 'winter', name: 'winter term' },
    { month: 7, day: 31, term: 'summer', name: 'summer term' },
    { month: 12, day: 6, term: 'fall', name: 'fall term' },
  ],
  // UK and Ireland: three terms, autumn to mid-December, spring to late March, summer to mid-June.
  GB: [
    { month: 3, day: 27, term: 'spring', name: 'spring term' },
    { month: 6, day: 19, term: 'summer', name: 'summer term' },
    { month: 12, day: 12, term: 'autumn', name: 'autumn term' },
  ],
  IE: TWO_SEMESTERS([4, 24], [12, 5], ['second', 'semester 2', 'first', 'semester 1']),
  // Australia and New Zealand: semester 1 Feb to early June, semester 2 July to late October.
  AU: TWO_SEMESTERS([6, 6], [10, 31], ['first', 'semester 1', 'second', 'semester 2']),
  NZ: TWO_SEMESTERS([6, 6], [10, 17], ['first', 'semester 1', 'second', 'semester 2']),
  // Singapore: semester 1 August to mid-November, semester 2 January to mid-April.
  SG: TWO_SEMESTERS([4, 17], [11, 14], ['second', 'semester 2', 'first', 'semester 1']),
  // Germany: Wintersemester lectures to mid-February, Sommersemester to late July.
  DE: TWO_SEMESTERS([2, 13], [7, 24], ['winter', 'winter semester', 'summer', 'summer semester']),
  AT: TWO_SEMESTERS([1, 30], [6, 30], ['winter', 'winter semester', 'summer', 'summer semester']),
  // Switzerland: autumn semester to late December, spring semester to the end of May.
  CH: TWO_SEMESTERS([5, 29], [12, 18], ['spring', 'spring semester', 'autumn', 'autumn semester']),
  // Netherlands: semester 1 to late January, semester 2 to early July.
  NL: TWO_SEMESTERS([1, 30], [7, 3], ['first', 'semester 1', 'second', 'semester 2']),
  // Nordics: autumn to mid-December (Sweden into January), spring to early June (Finland end of May).
  NO: TWO_SEMESTERS([6, 12], [12, 18], ['spring', 'spring semester', 'autumn', 'autumn semester']),
  DK: TWO_SEMESTERS([6, 12], [12, 18], ['spring', 'spring semester', 'autumn', 'autumn semester']),
  SE: TWO_SEMESTERS([1, 16], [6, 5], ['autumn', 'autumn semester', 'spring', 'spring semester']),
  FI: TWO_SEMESTERS([5, 29], [12, 18], ['spring', 'spring semester', 'autumn', 'autumn semester']),
  // Japan: spring semester April to late July, fall October to late January.
  JP: TWO_SEMESTERS([1, 30], [7, 31], ['fall', 'fall semester', 'spring', 'spring semester']),
  // South Korea: spring March to late June, fall September to mid-December.
  KR: TWO_SEMESTERS([6, 19], [12, 18], ['spring', 'spring semester', 'fall', 'fall semester']),
  // France: semester 1 to mid-December, semester 2 to mid-May.
  FR: TWO_SEMESTERS([5, 15], [12, 18], ['second', 'semester 2', 'first', 'semester 1']),
  // Taiwan: fall to mid-January, spring to mid-June. Hong Kong: to late November and late April.
  TW: TWO_SEMESTERS([1, 16], [6, 19], ['fall', 'fall semester', 'spring', 'spring semester']),
  HK: TWO_SEMESTERS([4, 24], [11, 28], ['second', 'semester 2', 'first', 'semester 1']),
};

/** Regions with their own calendar; everywhere else uses the US one. */
export const TERM_REGIONS = Object.keys(CALENDARS);

function calendarFor(region: string, system: TermSystem): TermEnd[] {
  if (system === 'quarter' && (region === 'US' || region === 'CA')) return US_QUARTERS;
  return CALENDARS[region] ?? US_SEMESTERS;
}

/** The Friday on or before the given day of a month, as a local date. */
function fridayOnOrBefore(year: number, month: number, day: number): string {
  let d = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  while (weekdayOf(d) !== 'fri') d = addDays(d, -1);
  return d;
}

/**
 * Where a repeating class most likely ends when the syllabus does not say: the end of the term
 * it starts in, from the person's region and term system. US semesters: fall classes end the
 * second week of December, spring the second week of May, summer the first week of August. A
 * class has to run at least four weeks, so one starting late November belongs to spring, not to
 * a December that is two weeks away.
 */
export function typicalTermEnd(start: string, region = dateLocale().region, system = dateLocale().termSystem): { date: string; term: Term; name: string } {
  const year = Number(start.slice(0, 4));
  const earliest = addDays(start, 28);
  const candidates: { date: string; term: Term; name: string }[] = [];
  for (const y of [year, year + 1]) {
    for (const t of calendarFor(region, system)) candidates.push({ date: fridayOnOrBefore(y, t.month, t.day), term: t.term, name: t.name });
  }
  return candidates.sort((a, b) => a.date.localeCompare(b.date)).find((c) => c.date >= earliest)!;
}
