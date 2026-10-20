import { describe, expect, it } from 'vitest';
import type { Item } from '@dayli/schema';
import { planRingingAlarms } from './alarm-plan';

const item: Item = { id: 'task', kind: 'task', title: 'Assignment', category: 'school', icon: 'check', date: '2026-10-20', start: '13:00', end: null,
  isDeadline: false, urgent: true, done: false, completedAt: null, courseId: null, employer: null, sourceId: null, batchId: null, notes: null, createdAt: '2026-10-19T12:00:00Z' };

describe('ringing alarm plan', () => {
  it('converts a chosen local date/time for both events and to-dos', () => {
    expect(planRingingAlarms([item, { ...item, id: 'event', kind: 'event' }])).toEqual([
      { id: 'task', title: 'Assignment', fireAt: new Date(2026, 9, 20, 13, 0).getTime() / 1000 },
      { id: 'event', title: 'Assignment', fireAt: new Date(2026, 9, 20, 13, 0).getTime() / 1000 },
    ]);
  });
  it('removes completed, unmarked, sample, untimed and invalid-date items', () => {
    expect(planRingingAlarms([
      { ...item, done: true }, { ...item, urgent: false }, { ...item, sourceId: 'sample' },
      { ...item, start: null }, { ...item, start: '25:00' }, { ...item, date: '2026-02-30' },
    ])).toEqual([]);
  });
  it('preserves past urgent IDs so a currently ringing alarm is not stopped by foreground sync', () => {
    expect(planRingingAlarms([{ ...item, date: '2020-01-01' }])[0]?.id).toBe('task');
  });
});
