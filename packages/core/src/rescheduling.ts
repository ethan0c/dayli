import type { Item } from '@dayli/schema';
import { addDays, dayNumber, toMinutes } from './dates';
import { findConflicts } from './conflicts';
import { intervalOf, overlap } from './intervals';

/** Unknown commitments stay fixed. A person can explicitly mark an event flexible. */
export function isFlexibleEvent(item: Item): boolean {
  if (item.kind !== 'event' || item.isDeadline || item.icon === 'exam') return false;
  if (item.timeFlexibility) return item.timeFlexibility === 'flexible';
  if (item.category === 'work' || item.employer || /\b(shift|class|lecture|lab|clinical|exam|quiz|test|appointment|dentist|doctor|interview|flight|train)\b/i.test(item.title)) return false;
  return /\b(study|studying|revision|homework|reading|gym|workout|errands)\b/i.test(item.title);
}

export type RescheduleSlot = { date: string; start: string; end: string };

/**
 * Nearest same-day slot first, then the next six days, 8 am–10 pm, keeping the duration and 15 minutes between
 * commitments. Never move a fixed event, a deadline, or an ongoing event.
 * The caller changes only the selected occurrence, never the whole series.
 * Unknown event times make availability uncertain, so that day is skipped.
 * Coursework stays before the next known deadline in the same course.
 */
export function suggestReschedule(item: Item, items: Item[], now: { date: string; time: string }): RescheduleSlot | null {
  if (!isFlexibleEvent(item) || item.done || !item.start || !item.end || item.end <= item.start) return null;
  const current = dayNumber(now.date) * 1440 + toMinutes(now.time);
  const original = intervalOf(item)!;
  if (original.start <= current || !findConflicts(items).some((pair) => pair.a === item.id || pair.b === item.id)) return null;
  const others = items.filter((other) => other.id !== item.id && other.kind === 'event' && !other.done);
  const busy = others.map(intervalOf).filter((iv) => iv !== null);
  const duration = original.end - original.start;
  const due = item.courseId ? Math.min(...items.filter((other) => other.isDeadline && !other.done && other.courseId === item.courseId)
    .map((other) => dayNumber(other.date) * 1440 + toMinutes(other.start ?? '23:59')).filter((minute) => minute > original.start)) : Infinity;
  for (let offset = 0; offset < 7; offset++) {
    const date = addDays(item.date, offset);
    if (others.some((other) => other.date === date && (!other.start || !other.end))) continue;
    const base = dayNumber(date) * 1440;
    const earliest = Math.ceil(Math.max(base + 8 * 60, current + 15) / 15) * 15;
    const latest = Math.min(base + 22 * 60, due) - duration;
    const candidates: number[] = [];
    for (let start = earliest; start <= latest; start += 15) {
      const padded = { start: start - 15, end: start + duration + 15 };
      if (!busy.some((iv) => overlap(padded, iv) > 0)) candidates.push(start);
    }
    const preferred = base + toMinutes(item.start);
    candidates.sort((a, b) => Math.abs(a - preferred) - Math.abs(b - preferred) || a - b);
    const start = candidates[0];
    if (start === undefined) continue;
    const time = (minute: number) => `${String(Math.floor((minute - base) / 60)).padStart(2, '0')}:${String((minute - base) % 60).padStart(2, '0')}`;
    return { date, start: time(start), end: time(start + duration) };
  }
  return null;
}

export type MovableOverlap = { flexible: Item; other: Item };

/**
 * The soonest overlap Semli could resolve: an upcoming flexible event that clashes with another,
 * looking up to a week ahead, or on the one day `on` however far out. Null when every overlap is
 * between fixed plans or already started.
 */
export function movableOverlap(items: Item[], now: { date: string; time: string }, on?: string): MovableOverlap | null {
  const current = dayNumber(now.date) * 1440 + toMinutes(now.time);
  const horizon = on ? Infinity : current + 7 * 1440;
  const byId = new Map(items.map((item) => [item.id, item]));
  let best: MovableOverlap | null = null;
  let bestStart = Infinity;
  for (const pair of findConflicts(items)) {
    for (const [id, otherId] of [[pair.a, pair.b], [pair.b, pair.a]] as const) {
      const item = byId.get(id);
      const other = byId.get(otherId);
      if (!item || !other || !isFlexibleEvent(item) || (on && item.date !== on)) continue;
      const start = intervalOf(item)?.start ?? -Infinity;
      if (start <= current || start > horizon || start >= bestStart) continue;
      best = { flexible: item, other };
      bestStart = start;
    }
  }
  return best;
}

/** Separate columns for connected overlapping events, including nested events. */
export function eventLanes(items: Item[]): Map<string, { lane: number; lanes: number }> {
  const timed = items.filter((item) => item.kind === 'event').map((item) => ({ item, iv: intervalOf(item) }))
    .filter((entry) => entry.iv !== null).sort((a, b) => a.iv!.start - b.iv!.start || b.iv!.end - a.iv!.end);
  const result = new Map<string, { lane: number; lanes: number }>();
  let group: { id: string; lane: number }[] = [];
  let ends: number[] = [];
  const flush = () => {
    for (const entry of group) result.set(entry.id, { lane: entry.lane, lanes: ends.length });
    group = [];
    ends = [];
  };
  for (const { item, iv } of timed) {
    if (ends.length && ends.every((end) => end <= iv!.start)) flush();
    const free = ends.findIndex((end) => end <= iv!.start);
    const lane = free < 0 ? ends.length : free;
    ends[lane] = iv!.end;
    group.push({ id: item.id, lane });
  }
  flush();
  return result;
}
