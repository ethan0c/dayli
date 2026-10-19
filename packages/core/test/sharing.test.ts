import type { Item } from '@dayli/schema';
import { describe, expect, it } from 'vitest';
import { schedulePreview } from '../src';

const date = '2026-10-19';
const item = (patch: Partial<Item>): Item => ({
  id: 'private-id', date, start: '16:00', end: '22:00', kind: 'event', title: 'Café shift',
  category: 'work', icon: 'work', isDeadline: false, done: false, completedAt: null,
  employer: 'Private employer', courseId: 'private-course', sourceId: 'private.pdf', batchId: 'private-batch',
  notes: 'Private notes', createdAt: '2026-10-19T12:00:00Z', ...patch,
});
const options = { date, range: 'week' as const, categories: ['work', 'school', 'personal'] as Item['category'][], showTitles: true };

describe('schedule sharing preview', () => {
  it('projects an allowlist without notes, sources, employer, or private IDs', () => {
    const entry = schedulePreview([item({})], options).entries[0]!;
    expect(Object.keys(entry).sort()).toEqual(['category', 'date', 'end', 'isDeadline', 'kind', 'start', 'title']);
    expect(JSON.stringify(entry)).not.toContain('Private');
  });
  it('redacts names before the preview receives them', () => {
    const result = schedulePreview([item({}), item({ id: 'task', kind: 'task', title: 'Private assignment', start: null, end: null })], { ...options, showTitles: false });
    expect(result.entries.map((entry) => entry.title).sort()).toEqual(['Busy', 'To-do']);
    expect(JSON.stringify(result)).not.toContain('Café');
  });
  it('filters categories and completed entries, including an empty selection', () => {
    const items = [item({}), item({ id: 'done', done: true }), item({ id: 'school', category: 'school' })];
    expect(schedulePreview(items, { ...options, categories: ['school'] }).entries).toHaveLength(1);
    expect(schedulePreview(items, { ...options, categories: [] }).entries).toEqual([]);
    expect(schedulePreview(items, options).entries).toHaveLength(2);
  });
  it('uses Monday–Sunday across a year boundary and supports a single day', () => {
    expect(schedulePreview([], { ...options, date: '2027-01-01' })).toMatchObject({ from: '2026-12-28', to: '2027-01-03' });
    expect(schedulePreview([item({}), item({ id: 'tomorrow', date: '2026-10-20' })], { ...options, range: 'day' }).entries).toHaveLength(1);
  });
  it('includes overnight commitments carried into the selected day', () => {
    const night = item({ date: '2026-10-18', start: '22:00', end: '07:00' });
    expect(schedulePreview([night], { ...options, range: 'day' }).entries).toHaveLength(1);
    expect(schedulePreview([{ ...night, end: '00:00' }], { ...options, range: 'day' }).entries).toHaveLength(0);
  });
});
