import { addDays, diffDays } from '@dayli/core';
import type { Item } from '@dayli/schema';

export interface Break {
  label: string;
  start: string;
  end: string;
}

export interface Moment {
  /** Line above the number: "Fall break in". */
  lead: string;
  /** The one big number: "9 days". */
  big: string;
  /** One sentence under it. */
  line: string;
  /** The text button, if there is something to do about it. */
  action?: { label: string; href: string };
  /** Bundled photo for now; a sourced set later. */
  image: number;
}

const PHOTO = require('../../assets/showcase/moment.jpg');

/**
 * A moment is a day that matters more than the list: a break coming up, a week of finals,
 * the last exam done. Only one shows, and only when there is one. Ordinary days have none.
 */
export function momentFor(items: Item[], breaks: Break[], today: string): Moment | null {
  const open = items.filter((i) => !i.done);
  const soonBreak = breaks
    .filter((b) => b.start > today && diffDays(today, b.start) <= 21)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  if (soonBreak) {
    const days = diffDays(today, soonBreak.start);
    const landing = open.filter((i) => i.isDeadline && i.date >= soonBreak.start && i.date <= soonBreak.end).length;
    return {
      lead: `${soonBreak.label} in`,
      big: `${days} ${days === 1 ? 'day' : 'days'}`,
      line: landing ? `${landing} ${landing === 1 ? 'deadline lands' : 'deadlines land'} that week.` : 'Nothing lands that week. Enjoy it.',
      action: landing ? { label: 'Move them earlier', href: '/plan' } : undefined,
      image: PHOTO,
    };
  }
  // A dense week of deadlines ahead reads as finals.
  const window = open.filter((i) => i.isDeadline && i.date > today && diffDays(today, i.date) <= 14).sort((a, b) => a.date.localeCompare(b.date));
  for (const first of window) {
    const cluster = window.filter((i) => diffDays(first.date, i.date) >= 0 && diffDays(first.date, i.date) <= 6);
    if (cluster.length >= 3) {
      const days = diffDays(today, first.date);
      return {
        lead: 'A heavy week starts in',
        big: `${days} ${days === 1 ? 'day' : 'days'}`,
        line: `${cluster.length} deadlines in ${diffDays(first.date, cluster[cluster.length - 1]!.date) + 1} days.`,
        action: { label: 'Plan the week', href: '/plan' },
        image: PHOTO,
      };
    }
  }
  // The last exam of a run, finished today.
  const doneToday = items.filter((i) => i.done && i.isDeadline && i.date === today).length;
  const left = open.filter((i) => i.isDeadline && i.date > today && diffDays(today, i.date) <= 7).length;
  if (doneToday > 0 && left === 0) {
    return { lead: 'Deadlines left this week', big: '0', line: `${doneToday === 1 ? 'The last one' : `${doneToday} of them`} done today.`, image: PHOTO };
  }
  void addDays;
  return null;
}
