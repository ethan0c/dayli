import { isLocalDate, isLocalTime } from '@dayli/core';
import type { Category, Item } from '@dayli/schema';

export interface ManualDraft {
  kind: 'task' | 'event';
  title: string;
  category: Category;
  date: string;
  start: string;
  end: string;
  allDay: boolean;
  hasDueTime: boolean;
  isDeadline: boolean;
  courseId: string | null;
  employer: string;
  notes: string;
}

export type ManualItem = Omit<Item, 'id' | 'createdAt' | 'batchId'>;
export type ManualResult = { ok: true; item: ManualItem } | { ok: false; error: string };

/** Validate before touching the store; dates are local calendar dates, never UTC. */
export function buildManualItem(draft: ManualDraft): ManualResult {
  if (!draft.title.trim()) return { ok: false, error: 'Give your plan a title.' };
  if (!isLocalDate(draft.date)) return { ok: false, error: 'Choose a valid date.' };
  const timedEvent = draft.kind === 'event' && !draft.allDay;
  const hasStart = timedEvent || (draft.kind === 'task' && draft.hasDueTime);
  if (hasStart && !isLocalTime(draft.start)) return { ok: false, error: 'Choose a valid time.' };
  if (timedEvent && !isLocalTime(draft.end)) return { ok: false, error: 'Choose a valid end time.' };
  if (timedEvent && draft.start === draft.end) return { ok: false, error: 'Choose an end time different from the start.' };
  return { ok: true, item: {
    kind: draft.kind, title: draft.title.trim(), category: draft.category,
    icon: draft.kind === 'event' ? 'calendar' : 'check',
    date: draft.date, start: hasStart ? draft.start : null, end: timedEvent ? draft.end : null,
    isDeadline: draft.kind === 'task' && draft.isDeadline,
    done: false, completedAt: null, sourceId: null,
    courseId: draft.category === 'school' ? draft.courseId : null,
    employer: draft.category === 'work' ? draft.employer.trim() || null : null,
    notes: draft.notes.trim() || null,
  } };
}

/** Round forward to the next half hour; retain local time even across midnight. */
export function defaultManualTimes(now: Date): { start: string; end: string } {
  const minutes = (Math.floor((now.getHours() * 60 + now.getMinutes()) / 30) + 1) * 30;
  const clock = (value: number) => `${String(Math.floor(value / 60) % 24).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
  return { start: clock(minutes), end: clock(minutes + 60) };
}
