import type { Item } from '@dayli/schema';
import { addDays, dayNumber, diffDays, formatRange, formatTime, monthDay, toMinutes, weekdayOf, weekOf } from './dates';
import { eventInterval, intervalOf, overlap, union } from './intervals';
import { assessment } from './assessment';
import { findConflicts } from './conflicts';

export type LocalNow = { date: string; time: string };
export type WorkDates = Record<string, string>;

const absoluteMinute = (date: string, time: string) => dayNumber(date) * 1440 + toMinutes(time);

/** Work dates are separate from original event/deadline dates. Never rewrite an imported due date. */
export function todayItems(items: Item[], date: string, workDates: WorkDates = {}): Item[] {
  const dayStart = absoluteMinute(date, '00:00');
  // Untimed to-dos lead, as on Plan: they can be started now. Then the day in time order, done last.
  // A task moved here from another day keeps its original time, so it counts as untimed today.
  const displayTime = (item: Item) => item.kind === 'event' && item.date < date ? '00:00' : item.date === date ? item.start ?? '' : '';
  return items.filter((item) => {
    if (item.date === date || (item.kind === 'task' && workDates[item.id] === date)) return true;
    const interval = item.kind === 'event' ? intervalOf(item) : null;
    return interval && interval.start < dayStart && interval.end > dayStart;
  })
    .sort((a, b) => Number(a.done) - Number(b.done)
      || displayTime(a).localeCompare(displayTime(b))
      || a.title.localeCompare(b.title));
}

export function overdueTasks(items: Item[], date: string, workDates: WorkDates = {}): Item[] {
  return items.filter((item) => item.kind === 'task' && !item.done && item.date < date && workDates[item.id] !== date)
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

/** Current intervals and the next timed event share one definition across the UI. */
function eventsAround(items: Item[], now: LocalNow) {
  const minute = absoluteMinute(now.date, now.time);
  const events = items.filter((item) => item.kind === 'event' && !item.done);
  const current = events.filter((item) => {
    const interval = intervalOf(item);
    return interval && interval.start <= minute && interval.end > minute;
  }).sort((a, b) => intervalOf(a)!.end - intervalOf(b)!.end);
  const next = events.filter((item) => item.date === now.date && item.start && absoluteMinute(item.date, item.start) > minute)
    .sort((a, b) => a.start!.localeCompare(b.start!))[0];
  return { current, next };
}

/** An event can be "Now" only when its end is known, including after midnight. */
export function featuredCommitment(items: Item[], now: LocalNow): { item: Item; ongoing: boolean } | null {
  const { current, next } = eventsAround(items, now);
  if (current[0]) return { item: current[0], ongoing: true };
  return next ? { item: next, ongoing: false } : null;
}

/** Includes overnight events from yesterday; tasks and events without known ends never imply "ongoing". */
/** Where Today's countdown stands: running out on what is on now, counting to what is next, or neither. */
export type CountdownState = 'ends' | 'next' | 'now';

/**
 * The sentence under Today's big number, which finishes it: "34m" then "until Stats lecture
 * ends · 10:15 am". `now` has no number, so the line is the item and its time.
 */
/**
 * The line under Today's big number, in two parts so a long title never strands its time on a
 * line of its own: `text` ("until Composition seminar ends") sits under the number, and `time`
 * ("2:45 pm") leads the grey line below, before the course.
 */
export function countdownParts(item: Pick<Item, 'title' | 'start' | 'end'>, state: CountdownState): { text: string; time: string | null } {
  if (state === 'ends') return { text: `until ${item.title} ends`, time: item.end ? formatTime(item.end) : null };
  if (state === 'next') return { text: `until ${item.title}`, time: item.start ? formatTime(item.start) : null };
  return { text: item.title, time: item.start ? (item.end ? formatRange(item.start, item.end) : formatTime(item.start)) : null };
}

/** Both parts on one line, for VoiceOver and anywhere the line is read whole. */
export function countdownLine(item: Pick<Item, 'title' | 'start' | 'end'>, state: CountdownState): string {
  const { text, time } = countdownParts(item, state);
  return time ? `${text} · ${time}` : text;
}

export function nowSummary(items: Item[], now: LocalNow): string {
  const { current, next } = eventsAround(items, now);
  if (current.length) {
    const active = current[0]!;
    const ongoing = `${active.title} until ${formatTime(active.end!, true)}`;
    return current.length > 1
      ? `${ongoing} · ${current.length - 1} overlapping ${current.length === 2 ? 'event' : 'events'}`
      : next ? `${ongoing} · next: ${next.title} at ${formatTime(next.start!, true)}` : ongoing;
  }
  return next ? `Next: ${next.title} at ${formatTime(next.start!, true)}` : 'No more timed events today.';
}

export interface DeadlineWindow {
  unbookedHours: number;
  workHours: number;
  hasUnknownTimes: boolean;
}

/** Estimate only: the last 72 hours before a deadline, clipped to now and 7 am–11 pm. */
export function deadlineWindow(items: Item[], deadline: Item, now: LocalNow): DeadlineWindow {
  const due = absoluteMinute(deadline.date, deadline.start ?? '23:59');
  const start = Math.max(absoluteMinute(now.date, now.time), due - 72 * 60);
  if (due <= start) return { unbookedHours: 0, workHours: 0, hasUnknownTimes: false };
  const events = items.filter((item) => item.kind === 'event' && !item.done && item.id !== deadline.id);
  const busy = union(events.map(intervalOf).filter((iv) => iv !== null));
  const work = union(events.filter((item) => item.category === 'work').map(intervalOf).filter((iv) => iv !== null));
  let unbooked = 0;
  let workMinutes = 0;
  for (let day = Math.floor(start / 1440); day <= Math.floor((due - 1) / 1440); day++) {
    const waking = { start: Math.max(start, day * 1440 + 7 * 60), end: Math.min(due, day * 1440 + 23 * 60) };
    if (waking.end <= waking.start) continue;
    unbooked += Math.max(0, waking.end - waking.start - busy.reduce((minutes, iv) => minutes + overlap(waking, iv), 0));
    workMinutes += work.reduce((minutes, iv) => minutes + overlap(waking, iv), 0);
  }
  const firstDate = addDays(now.date, Math.floor(start / 1440) - dayNumber(now.date));
  return {
    unbookedHours: Math.round(unbooked / 60 * 10) / 10,
    workHours: Math.round(workMinutes / 60 * 10) / 10,
    hasUnknownTimes: !deadline.start || events.some((item) => item.date >= firstDate && item.date <= deadline.date && (!item.start || !item.end)),
  };
}

export interface StartSuggestion {
  item: Item;
  reason: string;
  score: number;
}

export function deadlineReason(items: Item[], deadline: Item, now: LocalNow, window = deadlineWindow(items, deadline, now)): string {
  const days = diffDays(now.date, deadline.date);
  const due = days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `Due ${monthDay(deadline.date)}`;
  // Incomplete times cannot support confident free-time or shift-pressure claims.
  if (window.hasUnknownTimes) return `${due} · some times aren’t set yet.`;
  if (window.unbookedHours < 4) return `${due} · about ${window.unbookedHours} unbooked ${window.unbookedHours === 1 ? 'hour' : 'hours'} in the calendar before it.`;
  if (window.workHours >= 4) return `${due} · ${window.workHours} hours of work scheduled before this deadline.`;
  return `${due}.`;
}

/** Explainable heuristic, not an estimate of effort or an AI judgment about importance. */
export function startTodaySuggestions(items: Item[], now: LocalNow, workDates: WorkDates = {}, dismissed: string[] = []): StartSuggestion[] {
  return items.filter((item) => !item.done && item.isDeadline && item.date > now.date
    && diffDays(now.date, item.date) <= 7 && workDates[item.id] !== now.date && !dismissed.includes(item.id))
    .map((item) => {
      const days = diffDays(now.date, item.date);
      const window = deadlineWindow(items, item, now);
      const pressure = window.hasUnknownTimes ? 0 : Math.max(0, 4 - window.unbookedHours) * 3 + Math.min(window.workHours, 16) / 4;
      return { item, reason: deadlineReason(items, item, now, window), score: (8 - days) * 4 + pressure,
        relevant: days <= 3 || (!window.hasUnknownTimes && (window.workHours >= 4 || window.unbookedHours < 4)) };
    })
    .filter(({ relevant }) => relevant)
    .sort((a, b) => b.score - a.score || a.item.date.localeCompare(b.item.date) || a.item.id.localeCompare(b.item.id))
    .slice(0, 2);
}

export interface WeekendNudge {
  /** Open to-dos due Saturday through Monday, soonest first, at most three. */
  items: Item[];
  /** Whole free hours tonight, from 5 pm (or now) to 11 pm. */
  freeHours: number;
  /** All due by Sunday, or some on Monday. */
  by: 'weekend' | 'monday';
}

/**
 * Friday from noon to 9 pm: work due over the weekend or on Monday, and a free evening to do it in.
 * Only to-dos, only ones not already planned for today, only with two or more unbooked hours
 * tonight. It sets a work day when accepted; due dates never move.
 */
export function weekendNudge(items: Item[], now: LocalNow, workDates: WorkDates = {}): WeekendNudge | null {
  if (weekdayOf(now.date) !== 'fri' || now.time < '12:00' || now.time >= '21:00') return null;
  const due = items.filter((item) => item.kind === 'task' && !item.done && item.date > now.date && item.date <= addDays(now.date, 3)
    && workDates[item.id] !== now.date)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.start ?? '').localeCompare(b.start ?? '') || a.title.localeCompare(b.title));
  if (!due.length) return null;
  const busy = union(items.filter((item) => item.kind === 'event' && !item.done).map(eventInterval).filter((iv) => iv !== null));
  const evening = { start: Math.max(absoluteMinute(now.date, '17:00'), absoluteMinute(now.date, now.time)), end: absoluteMinute(now.date, '23:00') };
  const freeHours = Math.floor((evening.end - evening.start - busy.reduce((minutes, iv) => minutes + overlap(evening, iv), 0)) / 60);
  if (freeHours < 2) return null;
  return { items: due.slice(0, 3), freeHours, by: due.some((item) => item.date === addDays(now.date, 3)) ? 'monday' : 'weekend' };
}

export function tomorrowSummary(items: Item[], now: LocalNow, workDates: WorkDates = {}): string | null {
  if (now.time < '18:00') return null;
  const day = addDays(now.date, 1);
  // A peek reads as the day in time order, so what has a time leads here, unlike the list.
  const timed = (item: Item) => (item.kind === 'event' && item.date < day) || (item.date === day && !!item.start);
  const open = todayItems(items, day, workDates).filter((item) => !item.done);
  const tomorrow = [...open.filter(timed), ...open.filter((item) => !timed(item))];
  if (!tomorrow.length) return 'Tomorrow has no plans yet.';
  const labels = tomorrow.slice(0, 3).map((item) => `${item.title}${item.kind === 'event' && item.date < addDays(now.date, 1) && item.end ? ` until ${formatTime(item.end, true)}` : item.date === addDays(now.date, 1) && item.start ? ` at ${formatTime(item.start, true)}` : item.isDeadline ? ' due' : ''}`);
  return `Tomorrow: ${labels.join(' · ')}${tomorrow.length > 3 ? ` · +${tomorrow.length - 3} more` : ''}`;
}

export interface SpreadStep {
  item: Item;
  date: string;
}

/** Waking hours (7 am–11 pm, from now on today) not taken by an event. */
function freeHoursOn(busy: ReturnType<typeof union>, date: string, now: LocalNow): number {
  const day = dayNumber(date) * 1440;
  const waking = { start: Math.max(day + 7 * 60, date === now.date ? absoluteMinute(now.date, now.time) : 0), end: day + 23 * 60 };
  if (waking.end <= waking.start) return 0;
  return (waking.end - waking.start - busy.reduce((minutes, iv) => minutes + overlap(waking, iv), 0)) / 60;
}

/**
 * A start day for each task in a run of deadlines: the lightest day in the four before it is due
 * (most unbooked hours, fewest other tasks), never before today and, with `until`, before that day.
 * Exams and other events have nothing to move; tasks that already have a work day keep it.
 * Due dates never change; the start day is a work date, like "Work on it today".
 */
export function spreadWork(items: Item[], ids: string[], now: LocalNow, workDates: WorkDates = {}, until?: string): SpreadStep[] {
  const busy = union(items.filter((item) => item.kind === 'event' && !item.done).map(intervalOf).filter((iv) => iv !== null));
  const load = new Map<string, number>();
  for (const item of items) {
    if (item.kind !== 'task' || item.done) continue;
    const day = workDates[item.id] ?? item.date;
    load.set(day, (load.get(day) ?? 0) + 1);
  }
  const wanted = new Set(ids);
  const tasks = items.filter((item) => wanted.has(item.id) && item.kind === 'task' && !item.done && !(workDates[item.id] && workDates[item.id]! >= now.date))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.start ?? '').localeCompare(b.start ?? ''));
  const steps: SpreadStep[] = [];
  for (const item of tasks) {
    let last = addDays(item.date, -1);
    if (until && addDays(until, -1) < last) last = addDays(until, -1);
    let best: { date: string; score: number } | null = null;
    for (let day = [addDays(item.date, -4), now.date].sort()[1]!; day <= last; day = addDays(day, 1)) {
      const score = freeHoursOn(busy, day, now) - 2 * (load.get(day) ?? 0);
      if (!best || score > best.score) best = { date: day, score };
    }
    if (!best) continue;
    load.set(best.date, (load.get(best.date) ?? 0) + 1);
    steps.push({ item, date: best.date });
  }
  return steps;
}

export interface TermSummary {
  /** Open deadlines from today on. */
  deadlines: number;
  /** The last of them, the end of the plan as far as Semli knows. */
  lastDate: string | null;
  /** The Monday of the week with the most deadlines, and how many. */
  busiestWeek: { start: string; count: number } | null;
  /** Exams among the deadlines (`assessment`), not quizzes. */
  exams: number;
  /** The first day a work shift overlaps a school event, if any. */
  clash: { date: string; work: string; school: string } | null;
  /** The next deadline. */
  first: Item | null;
}

/** The facts of a freshly imported plan, for onboarding's "your term at a glance". All real numbers. */
export function termSummary(items: Item[], today: string): TermSummary {
  const ahead = items
    .filter((i) => i.isDeadline && !i.done && i.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.start ?? '').localeCompare(b.start ?? ''));
  const perWeek = new Map<string, number>();
  for (const d of ahead) {
    const monday = weekOf(d.date)[0]!;
    perWeek.set(monday, (perWeek.get(monday) ?? 0) + 1);
  }
  let busiestWeek: TermSummary['busiestWeek'] = null;
  for (const [start, count] of [...perWeek].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (!busiestWeek || count > busiestWeek.count) busiestWeek = { start, count };
  }
  const byId = new Map(items.map((i) => [i.id, i]));
  let clash: TermSummary['clash'] = null;
  for (const c of findConflicts(items.filter((i) => i.date >= today))) {
    const a = byId.get(c.a)!;
    const b = byId.get(c.b)!;
    const work = a.category === 'work' ? a : b.category === 'work' ? b : null;
    const school = a.category === 'school' ? a : b.category === 'school' ? b : null;
    if (work && school && (!clash || work.date < clash.date)) clash = { date: work.date, work: work.title, school: school.title };
  }
  return {
    deadlines: ahead.length,
    lastDate: ahead.at(-1)?.date ?? null,
    busiestWeek,
    exams: ahead.filter((i) => assessment(i.title) === 'exam').length,
    clash,
    first: ahead[0] ?? null,
  };
}

type Countable = { kind: 'event' | 'task'; category: string; icon?: string | null; isDeadline: boolean };

/** What a counter calls an item: the word a student would use. */
function countNoun(it: Countable): [string, string] {
  if (it.icon === 'exam') return ['exam', 'exams'];
  if (it.kind === 'event' && it.category === 'work') return ['shift', 'shifts'];
  if (it.kind === 'event' && it.category === 'school') return ['class', 'classes'];
  if (it.kind === 'event') return ['event', 'events'];
  return it.isDeadline ? ['due', 'due'] : ['to-do', 'to-dos'];
}
const COUNT_ORDER = ['class', 'exam', 'shift', 'due', 'to-do', 'event'];

/**
 * A count that says what is there: "1 class · 1 exam", "2 classes · 3 shifts". More than three
 * kinds read as a list nobody parses, so they become "7 plans". Never the word "things".
 */
export function planCount(items: Countable[]): string {
  if (!items.length) return 'Nothing planned';
  const counts = new Map<string, { n: number; one: string; many: string }>();
  for (const it of items) {
    const [one, many] = countNoun(it);
    const c = counts.get(one) ?? { n: 0, one, many };
    c.n++;
    counts.set(one, c);
  }
  if (counts.size > 3) return `${items.length} plans`;
  return [...counts.values()].sort((a, b) => COUNT_ORDER.indexOf(a.one) - COUNT_ORDER.indexOf(b.one))
    .map((c) => `${c.n} ${c.n === 1 ? c.one : c.many}`).join(' · ');
}
