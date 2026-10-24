import { describe, expect, it } from 'vitest';
import { FULL_DAY, chartRange, hourLayout, hourScale, hourSpan, type HourSpan } from '../src';

const OPTS = { gap: 3, minHeight: 22, fullAt: 40, titleAt: 16 };
const SCALE = { minSpan: 6, targetHeight: 560, minPx: 28, maxPx: 44 };
const span = (id: string, start: string, end: string | null, kind: 'event' | 'task' = 'event') => hourSpan({ id, kind, start, end })!;
const layout = (spans: HourSpan[]) => {
  const blocks = hourLayout(spans, hourScale(spans, SCALE), OPTS);
  return Object.fromEntries(blocks.map((b) => [b.id, b]));
};
const bottomOf = (b: { top: number; height: number }) => b.top + b.height;

describe('the day by the hour', () => {
  it('keeps a seam between back-to-back blocks in one column', () => {
    const b = layout([span('exam', '09:00', '10:30'), span('bio', '10:30', '11:20')]);
    expect(b.exam!.lanes).toBe(1);
    expect(b.bio!.lanes).toBe(1);
    expect(b.bio!.top - bottomOf(b.exam!)).toBeCloseTo(3);
  });
  it('never grows a short block into the next one', () => {
    const b = layout([span('quiz', '14:00', '14:15'), span('lab', '14:15', '16:00')]);
    expect(bottomOf(b.quiz!)).toBeLessThanOrEqual(b.lab!.top - 3 + 1e-9);
    expect(b.quiz!.size).not.toBe('full');
    const five = layout([span('check', '13:55', '14:00'), span('lab', '14:00', '15:00')]);
    expect(five.check!.size).toBe('bar');
    expect(bottomOf(five.check!)).toBeLessThanOrEqual(five.lab!.top);
  });
  it('lets a short block grow when nothing is below it', () => {
    const b = layout([span('quiz', '14:00', '14:15')]);
    expect(b.quiz!.height).toBe(22);
  });
  it('puts only crossing times side by side', () => {
    const b = layout([span('shift', '16:00', '22:00'), span('study', '19:00', '20:00')]);
    expect([b.shift!.lanes, b.study!.lanes]).toEqual([2, 2]);
    expect(b.shift!.lane).not.toBe(b.study!.lane);
    const same = layout([span('a', '10:00', '11:00'), span('due', '10:00', null, 'task')]);
    expect(same.a!.lanes).toBe(2);
  });
  it('fits the scale to the day', () => {
    expect(hourScale([span('exam', '09:00', '10:30'), span('bio', '10:30', '11:20')], SCALE)).toEqual({ fromHour: 8, toHour: 14, pxPerHour: 44 });
    const long = hourScale([span('early', '07:00', '08:00'), span('late', '22:00', '23:00')], SCALE);
    expect(long).toMatchObject({ fromHour: 6, toHour: 24 });
    expect(long.pxPerHour).toBeCloseTo(560 / 18);
    expect(hourSpan({ id: 'night', kind: 'event', start: '22:00', end: '06:00' })!.end).toBe(1440);
  });
});

describe('marks in a week column', () => {
  it('merges marks that would overlap, keeping the strongest', async () => {
    const { mergeMarks } = await import('../src');
    const merged = mergeMarks([{ y: 100, kind: 'dot' as const }, { y: 104, kind: 'target' as const }, { y: 40, kind: 'ring' as const }], 12);
    expect(merged.map((m) => [m.kind, m.count])).toEqual([['ring', 1], ['target', 2]]);
    expect(mergeMarks([{ y: 10, kind: 'dot' as const }, { y: 13, kind: 'dot' as const, tone: 'red' }], 12)[0]).toMatchObject({ tone: 'red', count: 2 });
  });
});

describe('the range a compact chart covers', () => {
  const at = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  const s = (start: string, end: string) => ({ start: at(start), end: at(end) });
  it('runs from half an hour before the first thing to half an hour after the last, on whole hours', () => {
    expect(chartRange([s('09:00', '10:15'), s('17:00', '21:00')], 6)).toEqual([8 * 60, 22 * 60]);
    expect(chartRange([s('09:30', '10:45'), s('13:00', '15:50')], 6)).toEqual([9 * 60, 17 * 60]);
  });
  it('is never shorter than the minimum, growing an hour later, then earlier, in turn', () => {
    expect(chartRange([s('10:00', '11:00')], 6)).toEqual([8 * 60, 14 * 60]);
    expect(chartRange([s('22:00', '23:30')], 6)).toEqual([18 * 60, 24 * 60]);
  });
  it('stays inside the day', () => {
    expect(chartRange([s('00:10', '23:50')], 6)).toEqual([0, 24 * 60]);
  });
  it('covers 6 am to midnight with nothing timed', () => {
    expect(chartRange([], 6)).toEqual([...FULL_DAY]);
  });
});
