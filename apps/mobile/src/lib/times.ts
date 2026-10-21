import { toMinutes } from '@dayli/core';

export const DEFAULT_START = '09:00';

/** `time` plus `minutes`, wrapped at midnight, as HH:MM. */
export function plusMinutes(time: string, minutes: number): string {
  const total = (toMinutes(time) + minutes + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * The times to save the moment someone taps "Add a time" on an item that has none, so the tap
 * itself does something and the picker adjusts from a real value. A shift copies the last one
 * for that job; otherwise 9 am, ending an hour later (four for a shift).
 */
export function defaultTimes(item: { kind: 'event' | 'task'; category: string; start: string | null; end: string | null }, like?: { start: string | null; end: string | null } | null): { start: string; end: string | null } {
  const start = item.start ?? like?.start ?? DEFAULT_START;
  if (item.kind !== 'event') return { start, end: null };
  const end = item.end ?? (like?.start && like.end && like.start === start ? like.end : plusMinutes(start, item.category === 'work' ? 4 * 60 : 60));
  return { start, end };
}
