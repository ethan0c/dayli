import { addDays, dayNumber, diffDays, formatRange, formatTime, toMinutes, weekdayLong } from '@dayli/core';
import type { Item } from '@dayli/schema';

export interface ReminderPrefs {
  enabled: boolean;
  /** Minutes before a timed event. */
  eventLead: 10 | 30 | 60;
  /** HH:mm the day before a deadline. */
  dayBeforeAt: string;
  /** HH:mm on the morning of a deadline. */
  morningAt: string;
  quietStart: string;
  quietEnd: string;
  briefing: boolean;
  briefingAt: string;
}

export const DEFAULT_REMINDERS: ReminderPrefs = {
  enabled: true,
  eventLead: 30,
  dayBeforeAt: '18:00',
  morningAt: '08:00',
  quietStart: '22:00',
  quietEnd: '07:00',
  briefing: true,
  briefingAt: '08:00',
};

export interface PlannedNotification {
  /** Stable per item and reason, so re-planning produces the same ids. */
  id: string;
  title: string;
  body: string;
  /** Local date + time of delivery. */
  date: string;
  time: string;
  itemId: string | null;
  kind: 'event' | 'deadline' | 'briefing';
}

/** iOS keeps at most 64 pending local notifications; leave headroom. */
export const MAX_PENDING = 60;
export const BRIEFING_DAYS = 7;
export const HORIZON_DAYS = 14;

const toAbs = (date: string, time: string) => dayNumber(date) * 1440 + toMinutes(time);
const fromAbs = (abs: number): { date: string; time: string } => {
  const day = Math.floor(abs / 1440);
  const m = abs - day * 1440;
  const pad = (n: number) => String(n).padStart(2, '0');
  return { date: addDays('1970-01-01', day), time: `${pad(Math.floor(m / 60))}:${pad(m % 60)}` };
};

/** True when a minute-of-day falls inside the quiet window, which may wrap midnight. */
export function inQuietHours(time: string, prefs: ReminderPrefs): boolean {
  const t = toMinutes(time);
  const s = toMinutes(prefs.quietStart);
  const e = toMinutes(prefs.quietEnd);
  if (s === e) return false;
  return s < e ? t >= s && t < e : t >= s || t < e;
}

/** Push a delivery inside quiet hours to the end of the window, unless that would be after the thing itself. */
function respectQuiet(abs: number, itemAbs: number | null, prefs: ReminderPrefs): number {
  const { time } = fromAbs(abs);
  if (!inQuietHours(time, prefs)) return abs;
  const day = Math.floor(abs / 1440);
  const endToday = day * 1440 + toMinutes(prefs.quietEnd);
  const moved = endToday > abs ? endToday : endToday + 1440;
  if (itemAbs !== null && moved >= itemAbs) return abs;
  return moved;
}

function dayLine(items: Item[], date: string): string {
  const todays = items.filter((i) => i.date === date && !i.done);
  if (todays.length === 0) return '';
  const timed = todays.filter((i) => i.start).sort((a, b) => a.start!.localeCompare(b.start!));
  const parts = timed.slice(0, 3).map((i) => `${i.title} ${i.end && i.start ? formatRange(i.start, i.end) : formatTime(i.start!)}`);
  const tasks = todays.length - timed.length;
  const head = `${todays.length} ${todays.length === 1 ? 'thing' : 'things'} today`;
  const tail = [parts.join(', '), tasks > 0 ? `${tasks} to-do${tasks === 1 ? '' : 's'}` : ''].filter(Boolean).join('; ');
  return tail ? `${head}: ${tail}.` : `${head}.`;
}

/**
 * Everything that should be scheduled right now, in delivery order, capped for iOS.
 * Pure: the same items and prefs always produce the same plan.
 */
export interface PlanExtras {
  /** Free trial in progress: remind two days before it converts (the Blinkist pattern). */
  trial?: { endsAt: string; label: string } | null;
}

export function planReminders(items: Item[], prefs: ReminderPrefs, now: { date: string; time: string }, extras: PlanExtras = {}): PlannedNotification[] {
  if (!prefs.enabled && !prefs.briefing && !extras.trial) return [];
  const nowAbs = toAbs(now.date, now.time);
  const out: (PlannedNotification & { abs: number })[] = [];
  const push = (p: Omit<PlannedNotification, 'date' | 'time'>, abs: number) => {
    if (abs <= nowAbs) return;
    const { date, time } = fromAbs(abs);
    if (diffDays(now.date, date) > HORIZON_DAYS) return;
    out.push({ ...p, date, time, abs });
  };

  if (prefs.enabled) {
    for (const it of items) {
      if (it.done || it.date < now.date) continue;
      if (it.kind === 'event' && it.start) {
        const itemAbs = toAbs(it.date, it.start);
        const when = it.end ? formatRange(it.start, it.end) : formatTime(it.start);
        push(
          { id: `ev-${it.id}`, title: it.title, body: `Starts in ${prefs.eventLead} min, ${when}.`, itemId: it.id, kind: 'event' },
          respectQuiet(itemAbs - prefs.eventLead, itemAbs, prefs),
        );
      }
      if (it.isDeadline) {
        const dueAbs = it.start ? toAbs(it.date, it.start) : null;
        const dueLabel = it.start ? `${weekdayLong(it.date)} at ${formatTime(it.start)}` : weekdayLong(it.date);
        push(
          { id: `dl1-${it.id}`, title: `${it.title} is tomorrow`, body: `Due ${dueLabel}. A good evening to get ahead.`, itemId: it.id, kind: 'deadline' },
          respectQuiet(toAbs(addDays(it.date, -1), prefs.dayBeforeAt), dueAbs, prefs),
        );
        const morning = toAbs(it.date, prefs.morningAt);
        if (dueAbs === null || morning < dueAbs) {
          push({ id: `dl2-${it.id}`, title: `${it.title} today`, body: it.start ? `Due at ${formatTime(it.start)}.` : 'Due today.', itemId: it.id, kind: 'deadline' }, morning);
        }
      }
    }
  }

  if (prefs.briefing) {
    for (let d = 0; d < BRIEFING_DAYS; d++) {
      const date = addDays(now.date, d);
      const line = dayLine(items, date);
      const nextDeadline = items
        .filter((i) => i.isDeadline && !i.done && i.date > date && diffDays(date, i.date) <= 3)
        .sort((a, b) => a.date.localeCompare(b.date))[0];
      if (!line && !nextDeadline) continue;
      const body = [line, nextDeadline ? `${nextDeadline.title} ${weekdayLong(nextDeadline.date)}.` : ''].filter(Boolean).join(' ');
      push({ id: `brief-${date}`, title: 'Good morning', body, itemId: null, kind: 'briefing' }, toAbs(date, prefs.briefingAt));
    }
  }

  if (extras.trial) {
    const ends = new Date(extras.trial.endsAt);
    if (!Number.isNaN(ends.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const endDate = `${ends.getFullYear()}-${pad(ends.getMonth() + 1)}-${pad(ends.getDate())}`;
      push(
        { id: 'trial-reminder', title: 'Your Semli Plus trial ends in 2 days', body: `${extras.trial.label} unless you cancel. Manage it any time in You → Semli Plus.`, itemId: null, kind: 'briefing' },
        toAbs(addDays(endDate, -2), prefs.dayBeforeAt),
      );
    }
  }

  out.sort((a, b) => a.abs - b.abs);
  // Keep every briefing (they are few) and the soonest reminders up to the cap.
  const briefings = out.filter((p) => p.kind === 'briefing');
  const rest = out.filter((p) => p.kind !== 'briefing').slice(0, Math.max(0, MAX_PENDING - briefings.length));
  return [...briefings, ...rest]
    .sort((a, b) => a.abs - b.abs)
    .map(({ abs: _abs, ...p }) => p);
}
