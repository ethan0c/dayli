import type { Item } from '@dayli/schema';
import { dayNumber, toMinutes } from './dates';

export interface Interval {
  start: number; // absolute minutes since epoch day 0
  end: number;
}

/**
 * Absolute interval for a timed event. Overnight shifts (end < start) roll into the next day.
 * An end equal to the start is no end at all, never a 24-hour event.
 */
export function intervalOf(item: Pick<Item, 'date' | 'start' | 'end'>): Interval | null {
  if (!item.start || !item.end || item.end === item.start) return null;
  const base = dayNumber(item.date) * 1440;
  const start = base + toMinutes(item.start);
  let end = base + toMinutes(item.end);
  if (end <= start) end += 1440;
  return { start, end };
}

/** The time an event holds for overlaps: its own interval, or an hour from its start when it has no end, as the charts draw it. */
export function eventInterval(item: Pick<Item, 'date' | 'start' | 'end'>): Interval | null {
  if (!item.start) return null;
  const start = dayNumber(item.date) * 1440 + toMinutes(item.start);
  return intervalOf(item) ?? { start, end: start + 60 };
}

export function overlap(a: Interval, b: Interval): number {
  return Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start));
}

/** Merge overlapping intervals; result is sorted. */
export function union(intervals: Interval[]): Interval[] {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const out: Interval[] = [];
  for (const iv of sorted) {
    const last = out[out.length - 1];
    if (last && iv.start <= last.end) last.end = Math.max(last.end, iv.end);
    else out.push({ ...iv });
  }
  return out;
}
