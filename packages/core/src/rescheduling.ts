import type { Item } from '@dayli/schema';
import { dayNumber, toMinutes } from './dates';
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
 * Nearest same-day slot, 8 am–10 pm, keeping the duration and 15 minutes between
 * commitments. Never move a fixed event, a deadline, or an ongoing event.
 * The caller changes only the selected occurrence, never the whole series.
 * Unknown event times make availability uncertain, so no slot is offered that day.
 */
export function suggestReschedule(item: Item, items: Item[], now: { date: string; time: string }): RescheduleSlot | null {
  if (!isFlexibleEvent(item) || item.done || !item.start || !item.end || item.end <= item.start) return null;
  const base = dayNumber(item.date) * 1440;
  const current = dayNumber(now.date) * 1440 + toMinutes(now.time);
  const original = intervalOf(item)!;
  if (original.start <= current || !findConflicts(items).some((pair) => pair.a === item.id || pair.b === item.id)) return null;
  const others = items.filter((other) => other.id !== item.id && other.kind === 'event' && !other.done);
  if (others.some((other) => other.date === item.date && (!other.start || !other.end))) return null;
  const busy = others.map(intervalOf).filter((iv) => iv !== null);
  const duration = original.end - original.start;
  const earliest = Math.ceil(Math.max(base + 8 * 60, current + 15) / 15) * 15;
  const latest = base + 22 * 60 - duration;
  const candidates: number[] = [];
  for (let start = earliest; start <= latest; start += 15) {
    const padded = { start: start - 15, end: start + duration + 15 };
    if (!busy.some((iv) => overlap(padded, iv) > 0)) candidates.push(start);
  }
  candidates.sort((a, b) => Math.abs(a - original.start) - Math.abs(b - original.start) || a - b);
  const start = candidates[0];
  if (start === undefined) return null;
  const time = (minute: number) => `${String(Math.floor((minute - base) / 60)).padStart(2, '0')}:${String((minute - base) % 60).padStart(2, '0')}`;
  return { date: item.date, start: time(start), end: time(start + duration) };
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
