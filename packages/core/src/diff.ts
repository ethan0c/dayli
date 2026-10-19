import { intervalOf, overlap } from './intervals';

export interface Shift {
  date: string;
  start: string | null;
  end: string | null;
}

export interface ScheduleDiff<Old extends Shift, New extends Shift> {
  added: New[];
  changed: { before: Old; after: New }[];
  removed: Old[];
  unchanged: { before: Old; after: New }[];
}

/**
 * Compare a newly imported work schedule against the shifts already stored for
 * the same employer and date range. Shifts are paired by date; when a date has
 * several shifts they are paired by greatest time overlap.
 */
export function diffSchedule<Old extends Shift, New extends Shift>(
  existing: Old[],
  incoming: New[],
): ScheduleDiff<Old, New> {
  const result: ScheduleDiff<Old, New> = { added: [], changed: [], removed: [], unchanged: [] };
  const dates = new Set([...existing.map((s) => s.date), ...incoming.map((s) => s.date)]);

  for (const date of [...dates].sort()) {
    const olds = existing.filter((s) => s.date === date);
    const news = incoming.filter((s) => s.date === date);
    const usedOld = new Set<number>();

    news.forEach((n) => {
      let best = -1;
      let bestScore = -1;
      olds.forEach((o, i) => {
        if (usedOld.has(i)) return;
        const a = intervalOf(o);
        const b = intervalOf(n);
        const score = a && b ? overlap(a, b) : 0;
        if (score > bestScore) {
          best = i;
          bestScore = score;
        }
      });
      // Only pair across differing times when it's the only candidate left or they overlap.
      const remaining = olds.length - usedOld.size;
      if (best >= 0 && (bestScore > 0 || remaining === 1 || news.length === 1)) {
        usedOld.add(best);
        const before = olds[best]!;
        if (before.start === n.start && before.end === n.end) result.unchanged.push({ before, after: n });
        else result.changed.push({ before, after: n });
      } else {
        result.added.push(n);
      }
    });

    olds.forEach((o, i) => {
      if (!usedOld.has(i)) result.removed.push(o);
    });
  }
  return result;
}
