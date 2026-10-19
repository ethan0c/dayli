import type { Item } from '@dayli/schema';
import { addDays, dayNumber, diffDays, formatTime, monthDay, toMinutes } from './dates';
import { intervalOf, overlap, union } from './intervals';

export type LocalNow = { date: string; time: string };
export type WorkDates = Record<string, string>;

const absoluteMinute = (date: string, time: string) => dayNumber(date) * 1440 + toMinutes(time);

/** Work dates are separate from original event/deadline dates. Never rewrite an imported due date. */
export function todayItems(items: Item[], date: string, workDates: WorkDates = {}): Item[] {
  const dayStart = absoluteMinute(date, '00:00');
  const displayTime = (item: Item) => item.kind === 'event' && item.date < date ? '00:00' : item.date === date ? item.start ?? '24:00' : '24:00';
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

/** Includes overnight events from yesterday; tasks and events without known ends never imply "ongoing". */
export function nowSummary(items: Item[], now: LocalNow): string {
  const minute = absoluteMinute(now.date, now.time);
  const events = items.filter((item) => item.kind === 'event' && !item.done);
  const current = events.filter((item) => {
    const interval = intervalOf(item);
    return interval && interval.start <= minute && interval.end > minute;
  }).sort((a, b) => intervalOf(a)!.end - intervalOf(b)!.end);
  const next = events.filter((item) => item.date === now.date && item.start && absoluteMinute(item.date, item.start) > minute)
    .sort((a, b) => a.start!.localeCompare(b.start!))[0];
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
  if (window.workHours >= 4) return `${due} · ${window.workHours} hours of work booked in the lead-up.`;
  return `${due} · make a start before it gets close.`;
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

export function tomorrowSummary(items: Item[], now: LocalNow, workDates: WorkDates = {}): string | null {
  if (now.time < '18:00') return null;
  const tomorrow = todayItems(items, addDays(now.date, 1), workDates).filter((item) => !item.done);
  if (!tomorrow.length) return 'Tomorrow has no plans yet.';
  const labels = tomorrow.slice(0, 3).map((item) => `${item.title}${item.kind === 'event' && item.date < addDays(now.date, 1) && item.end ? ` until ${formatTime(item.end, true)}` : item.date === addDays(now.date, 1) && item.start ? ` at ${formatTime(item.start, true)}` : item.isDeadline ? ' due' : ''}`);
  return `Tomorrow: ${labels.join(' · ')}${tomorrow.length > 3 ? ` · +${tomorrow.length - 3} more` : ''}`;
}
