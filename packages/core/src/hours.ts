import { toMinutes } from './dates';

/**
 * The day by the hour, laid out so blocks never touch or cover each other. Real time decides
 * everything: a block may be drawn taller than its duration only while that does not reach the
 * next block, back-to-back blocks keep a seam between them, and only blocks whose times truly
 * cross sit side by side. Pure, so the rules are tested here rather than eyeballed on a phone.
 */

export type HourSpan = { id: string; start: number; end: number };
export type HourScale = { fromHour: number; toHour: number; pxPerHour: number };
/** How much text fits: title and time, the title alone, or nothing (a bar, listed below the chart). */
export type HourBlockSize = 'full' | 'title' | 'bar';
export type HourBlock = { id: string; top: number; height: number; lane: number; lanes: number; size: HourBlockSize };

export type HourOptions = {
  /** Space between two blocks that touch in time. */
  gap: number;
  /** The height a short block grows to when nothing is in the way. */
  minHeight: number;
  /** Heights at which a block shows title and time, or the title alone. */
  fullAt: number;
  titleAt: number;
};
export type HourScaleOptions = { minSpan: number; targetHeight: number; minPx: number; maxPx: number };

/** A timed item's minutes on its own day: an overnight event stops at midnight; a to-do takes half an hour. */
export function hourSpan(item: { id: string; kind: 'event' | 'task'; start: string | null; end: string | null }): HourSpan | null {
  if (!item.start) return null;
  const start = toMinutes(item.start);
  let end = item.kind === 'event' && item.end ? toMinutes(item.end) : start + 30;
  if (item.kind === 'event' && item.end && end <= start) end = 24 * 60;
  if (end <= start) end = start + 30;
  return { id: item.id, start, end: Math.min(end, 24 * 60) };
}

/** An hour before the first thing to an hour after the last, at least `minSpan` hours, scaled to fit. */
export function hourScale(spans: HourSpan[], opts: HourScaleOptions): HourScale {
  let fromHour = spans.length ? Math.max(0, Math.floor(Math.min(...spans.map((s) => s.start)) / 60) - 1) : 8;
  let toHour = spans.length ? Math.min(24, Math.ceil(Math.max(...spans.map((s) => s.end)) / 60) + 1) : 24;
  while (toHour - fromHour < opts.minSpan && (toHour < 24 || fromHour > 0)) {
    if (toHour < 24) toHour++;
    if (toHour - fromHour < opts.minSpan && fromHour > 0) fromHour--;
  }
  const hours = toHour - fromHour;
  return { fromHour, toHour, pxPerHour: Math.max(opts.minPx, Math.min(opts.maxPx, opts.targetHeight / hours)) };
}

/** The whole day, 6 am to midnight in minutes: what a compact chart covers when it has nothing timed to fit. */
export const FULL_DAY: readonly [number, number] = [6 * 60, 24 * 60];

/**
 * The part of the day a compact chart covers (the day bar, the week chart), in minutes: from half
 * an hour before the first thing to half an hour after the last, on whole hours, at least `minSpan`
 * hours and inside the day. A short day grows an hour later, then earlier, in turn, like `hourScale`.
 * Nothing timed: `FULL_DAY`.
 */
export function chartRange(spans: { start: number; end: number }[], minSpan: number): [number, number] {
  if (!spans.length) return [FULL_DAY[0], FULL_DAY[1]];
  let from = Math.max(0, Math.floor((Math.min(...spans.map((s) => s.start)) - 30) / 60));
  let to = Math.min(24, Math.ceil((Math.max(...spans.map((s) => s.end)) + 30) / 60));
  while (to - from < minSpan && (to < 24 || from > 0)) {
    if (to < 24) to++;
    if (to - from < minSpan && from > 0) from--;
  }
  return [from * 60, to * 60];
}

export function hourLayout(spans: HourSpan[], scale: HourScale, opts: HourOptions): HourBlock[] {
  const sorted = [...spans].sort((a, b) => a.start - b.start || b.end - a.end);
  // Columns, per cluster of items whose times truly cross. Touching is not crossing.
  const lanes = new Map<string, { lane: number; lanes: number }>();
  let group: { id: string; lane: number }[] = [];
  let ends: number[] = [];
  const flush = () => {
    for (const g of group) lanes.set(g.id, { lane: g.lane, lanes: ends.length });
    group = [];
    ends = [];
  };
  for (const s of sorted) {
    if (ends.length && ends.every((end) => end <= s.start)) flush();
    const free = ends.findIndex((end) => end <= s.start);
    const lane = free < 0 ? ends.length : free;
    ends[lane] = s.end;
    group.push({ id: s.id, lane });
  }
  flush();

  const px = (minute: number) => ((minute - scale.fromHour * 60) / 60) * scale.pxPerHour;
  const bottom = (scale.toHour - scale.fromHour) * scale.pxPerHour;
  const placed = sorted.map((s) => {
    const { lane, lanes: count } = lanes.get(s.id)!;
    const top = px(s.start) + opts.gap / 2;
    const natural = px(s.end) - px(s.start) - opts.gap;
    return { id: s.id, top, natural, lane, lanes: count, left: lane / count, right: (lane + 1) / count };
  });
  return placed.map((b) => {
    // The next block below that shares any of this block's width: the furthest a short block may grow.
    const limit = placed
      .filter((o) => o !== b && o.top > b.top && o.left < b.right && b.left < o.right)
      .reduce((min, o) => Math.min(min, o.top - opts.gap - b.top), bottom - b.top);
    const height = Math.max(1, Math.min(Math.max(opts.minHeight, b.natural), limit));
    const size: HourBlockSize = height >= opts.fullAt ? 'full' : height >= opts.titleAt ? 'title' : 'bar';
    return { id: b.id, top: b.top, height, lane: b.lane, lanes: b.lanes, size };
  });
}

/**
 * Marks in one narrow column that would land on each other: keep the strongest of each cluster
 * (an exam over a quiz over a due date, red over ink) and say how many it stands for, so two
 * deadlines at 11:59 pm read as one mark, not a smudge.
 */
export function mergeMarks<T extends { y: number; kind: 'dot' | 'ring' | 'target'; tone?: string }>(marks: T[], within: number): (T & { count: number })[] {
  const rank = (m: T) => (m.tone === 'red' ? 10 : 0) + (m.kind === 'target' ? 3 : m.kind === 'ring' ? 2 : 1);
  const out: (T & { count: number })[] = [];
  for (const m of [...marks].sort((a, b) => a.y - b.y)) {
    const last = out[out.length - 1];
    if (last && m.y - last.y < within) {
      const keep = rank(m) > rank(last) ? { ...m, y: last.y } : last;
      out[out.length - 1] = { ...keep, count: last.count + 1 };
    } else out.push({ ...m, count: 1 });
  }
  return out;
}
