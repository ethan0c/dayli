import { diffDays, toMinutes, weekOf, weekdayShort, type Draft } from '@dayli/core';
import type { Extraction } from '@dayli/schema';
import type { Day, TermMark } from '@/components/Mock';

/*
 * Turns an extraction into what the try-it result draws: the found line, the big
 * number, the one-line summary, a week chart or a term line, and the rows that
 * still need something from the reader. Pure, so it is easy to check by hand.
 */

const START = 6 * 60;
const SPAN = 24 * 60 - START;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type Need = { draft: Draft; pill: string; sub: string };
/** One found item as the result lists it: what, where it belongs, and when. */
export type FoundRow = { key: string; title: string; sub: string; when: string; lead: 'ring' | 'dot' };
export type View = { kind: 'week'; weeks: Day[][] } | { kind: 'term'; months: { label: string; left: number }[]; marks: TermMark[] } | null;
export interface Summary {
  found: string;
  big: string;
  line: string | null;
  view: View;
  /** The first few dated items, so the result is concrete even when nothing needs input. */
  rows: FoundRow[];
  /** How many dated items the rows leave out. */
  more: number;
  needs: Need[];
}

const CATEGORY = { work: 'Work', school: 'School', personal: 'Personal' } as const;
const ROWS = 5;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function compact(time: string): { h: string; s: 'a' | 'p' } {
  const mins = toMinutes(time);
  const h24 = Math.floor(mins / 60);
  const mm = mins % 60;
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return { h: mm ? `${h}:${String(mm).padStart(2, '0')}` : `${h}`, s: h24 < 12 ? 'a' : 'p' };
}

/** "4–10p", "9a–3p", "11a–5p": the label under a day bar. */
export function shortRange(start: string, end: string | null): string {
  const a = compact(start);
  if (!end) return `${a.h}${a.s}`;
  const b = compact(end);
  return a.s === b.s ? `${a.h}–${b.h}${b.s}` : `${a.h}${a.s}–${b.h}${b.s}`;
}

const pct = (mins: number) => Math.min(100, Math.max(0, ((mins - START) / SPAN) * 100));

function dayOf(date: string, list: Draft[]): Day {
  const label = weekdayShort(date);
  if (list.length === 0) return { label, under: 'off' };
  const timed = list.filter((d) => d.start);
  if (timed.length === 0) return { label, unknown: true, under: 'time?', underTone: 'amber' };
  const blocks = timed.map((d) => {
    const s = toMinutes(d.start!);
    const e = d.end ? toMinutes(d.end) : s + 60;
    return { top: pct(s), height: Math.max(3, pct(Math.max(e, s + 30)) - pct(s)) };
  });
  const first = timed[0]!;
  return { label, blocks, under: shortRange(first.start!, first.end) };
}

function hoursOf(list: Draft[]): number {
  let mins = 0;
  for (const d of list) if (d.start && d.end) mins += Math.max(0, toMinutes(d.end) - toMinutes(d.start));
  return Math.round(mins / 60);
}

const dayLabel = (date: string) => `${weekdayShort(date)} ${Number(date.slice(8, 10))}`;

export function summarize(ex: Extraction, drafts: Draft[]): Summary {
  const found =
    ex.detected_type === 'work_schedule'
      ? `Work schedule${ex.employer ? ` · ${ex.employer}` : ''} · found`
      : ex.detected_type === 'syllabus'
        ? `Syllabus${ex.course ? ` · ${ex.course.code ?? ex.course.title}` : ''} · found`
        : ex.detected_type === 'course_schedule'
          ? 'Class schedule · found'
          : 'From your message · found';

  const dated = drafts.filter((d): d is Draft & { date: string } => d.date !== null);
  const dates = dated.map((d) => d.date).sort();
  const first = dates[0] ?? null;
  const last = dates[dates.length - 1] ?? null;

  const shifts = ex.detected_type === 'work_schedule' || (drafts.length > 0 && drafts.every((d) => d.category === 'work' && d.kind === 'event'));
  const weeks = first && last ? [...new Set(dates.map((d) => weekOf(d)[0]!))].sort() : [];

  let big: string;
  let line: string | null = null;
  if (shifts) {
    big = plural(drafts.length, 'shift');
    const from = ex.covers_from ?? first;
    const to = ex.covers_to ?? last;
    const hours = hoursOf(drafts);
    line = [from && to ? (from === to ? dayLabel(from) : `${dayLabel(from)} to ${dayLabel(to)}`) : null, hours > 0 ? `${hours} hours` : null].filter(Boolean).join(' · ') || null;
  } else {
    big = plural(dated.length, 'date');
    const exams = drafts.filter((d) => d.icon === 'exam').length;
    const classes = drafts.filter((d) => d.seriesId).length;
    const due = drafts.length - exams - classes;
    if (ex.detected_type === 'syllabus' || ex.detected_type === 'course_schedule') {
      line = [exams ? plural(exams, 'exam') : null, due ? plural(due, 'due date') : null, classes ? plural(classes, 'class meeting') : null].filter(Boolean).join(', ') || null;
    } else {
      const events = drafts.filter((d) => d.kind === 'event').length;
      const tasks = drafts.length - events;
      const span = first && last ? (first === last ? dayLabel(first) : `${dayLabel(first)} to ${dayLabel(last)}`) : null;
      const counts = [events ? plural(events, 'event') : null, tasks ? plural(tasks, 'to-do') : null].filter(Boolean).join(', ');
      line = [span, counts || null].filter(Boolean).join(' · ') || null;
    }
  }

  let view: View = null;
  if (first && last && shifts && weeks.length <= 2) {
    view = {
      kind: 'week',
      weeks: weeks.map((monday) => weekOf(monday).map((date) => dayOf(date, dated.filter((d) => d.date === date)))),
    };
  } else if (first && last) {
    const span = Math.max(1, diffDays(first, last));
    const at = (date: string) => (first === last ? 50 : (diffDays(first, date) / span) * 100);
    const months: { label: string; left: number }[] = [];
    const seen = new Set<string>();
    for (const date of [first, ...dates.filter((d) => d.endsWith('-01'))]) {
      const key = date.slice(0, 7);
      if (seen.has(key)) continue;
      seen.add(key);
      months.push({ label: MONTHS[Number(date.slice(5, 7)) - 1]!, left: at(date) });
    }
    // The 1st of a month between two dates is not itself a date; walk the span for the rest.
    for (let m = Number(first.slice(5, 7)), y = Number(first.slice(0, 4)); ; ) {
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
      const date = `${y}-${String(m).padStart(2, '0')}-01`;
      if (date > last) break;
      if (!seen.has(date.slice(0, 7))) months.push({ label: MONTHS[m - 1]!, left: at(date) });
      seen.add(date.slice(0, 7));
    }
    months.sort((a, b) => a.left - b.left);
    const marks: TermMark[] = dated.map((d) => ({
      left: at(d.date),
      kind: d.icon === 'exam' || (d.isDeadline && d.kind === 'event') ? 'ring' : d.seriesId ? 'tick' : 'dot',
    }));
    // Keep labels from colliding: drop a month that sits within 9% of the previous one.
    const spaced = months.filter((mo, i) => i === 0 || mo.left - months[i - 1]!.left > 9);
    view = { kind: 'term', months: spaced, marks };
  }

  const needs: Need[] = [];
  const seriesSeen = new Set<string>();
  for (const d of drafts) {
    if (d.seriesId) {
      if (seriesSeen.has(d.seriesId)) continue;
      seriesSeen.add(d.seriesId);
    }
    const noDate = d.date === null;
    const noTime = d.kind === 'event' && !d.isDeadline && d.start === null;
    if (!noDate && !noTime && !d.seriesEndUnknown && !d.needsInput) continue;
    const pill = noDate ? 'Add a date' : noTime ? 'Add a time' : d.seriesEndUnknown ? 'Until when?' : 'Check it';
    const sub = d.question ?? (noDate ? 'No date in the source' : noTime ? 'No time in the source' : 'Semli is not sure about this one');
    needs.push({ draft: d, pill, sub });
  }

  const needKeys = new Set(needs.map((n) => n.draft.key));
  const seriesRow = new Set<string>();
  const listed = [...dated]
    .sort((a, b) => (a.date + (a.start ?? '')).localeCompare(b.date + (b.start ?? '')))
    .filter((d) => {
      if (needKeys.has(d.key)) return false;
      if (d.seriesId) {
        if (seriesRow.has(d.seriesId)) return false;
        seriesRow.add(d.seriesId);
      }
      return true;
    });
  const rows: FoundRow[] = listed.slice(0, ROWS).map((d) => ({
    key: d.key,
    title: d.title,
    sub: [d.courseCode ?? (d.category === 'work' ? ex.employer : null), d.seriesId ? 'Repeats' : CATEGORY[d.category]].filter(Boolean).join(' · '),
    when: d.start ? `${dayLabel(d.date)} · ${shortRange(d.start, d.kind === 'event' ? d.end : null)}` : dayLabel(d.date),
    lead: d.kind === 'task' || d.isDeadline ? 'ring' : 'dot',
  }));

  return { found, big, line, view, rows, more: Math.max(0, listed.length - ROWS), needs };
}
