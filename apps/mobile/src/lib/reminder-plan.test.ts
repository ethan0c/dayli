import type { Item } from '@dayli/schema';
import { describe, expect, it } from 'vitest';

import { DEFAULT_REMINDERS, inQuietHours, planReminders } from './reminder-plan';

function item(p: Partial<Item> & Pick<Item, 'id' | 'date'>): Item {
  return {
    kind: 'event', title: 'x', category: 'school', icon: 'calendar', start: null, end: null, isDeadline: false, done: false,
    completedAt: null, courseId: null, employer: null, sourceId: null, batchId: null, notes: null, createdAt: '2026-10-19T00:00:00Z', ...p,
  };
}
const now = { date: '2026-10-19', time: '12:00' };

describe('planReminders', () => {
  it('reminds before timed events and twice before deadlines', () => {
    const plan = planReminders(
      [
        item({ id: 'shift', title: 'Café shift', date: '2026-10-20', start: '16:00', end: '22:00' }),
        item({ id: 'exam', title: 'Stats exam', date: '2026-10-23', start: '09:00', end: '10:30', isDeadline: true }),
      ],
      { ...DEFAULT_REMINDERS, briefing: false },
      now,
    );
    expect(plan.map((p) => [p.id, p.date, p.time])).toEqual([
      ['ev-shift', '2026-10-20', '15:30'],
      ['dl1-exam', '2026-10-22', '18:00'],
      ['dl2-exam', '2026-10-23', '08:00'],
      ['ev-exam', '2026-10-23', '08:30'],
    ]);
  });

  it('moves a quiet-hours reminder to the end of the window, unless the event is sooner', () => {
    const plan = planReminders(
      [
        item({ id: 'late', title: 'Late task review', date: '2026-10-20', start: '23:00', end: '23:30' }),
        item({ id: 'early', title: 'Clinical', date: '2026-10-21', start: '06:30', end: '14:00' }),
      ],
      { ...DEFAULT_REMINDERS, briefing: false },
      now,
    );
    const byId = Object.fromEntries(plan.map((p) => [p.id, p]));
    // 22:30 is inside quiet hours; the next quiet end (07:00 next day) is after the event, so it stays.
    expect(byId['ev-late']).toMatchObject({ date: '2026-10-20', time: '22:30' });
    // 06:00 is inside quiet hours and 07:00 is after the 06:30 start, so it stays too.
    expect(byId['ev-early']).toMatchObject({ date: '2026-10-21', time: '06:00' });
  });

  it('skips the past, caps the count, and keeps briefings', () => {
    const many = Array.from({ length: 80 }, (_, i) => item({ id: `e${i}`, title: 'Lecture', date: '2026-10-21', start: `${String(8 + (i % 12)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`, end: '20:00' }));
    const plan = planReminders([...many, item({ id: 'past', date: '2026-10-19', start: '09:00', end: '10:00' })], DEFAULT_REMINDERS, now);
    expect(plan.length).toBeLessThanOrEqual(60);
    expect(plan.some((p) => p.id === 'ev-past')).toBe(false);
    expect(plan.filter((p) => p.kind === 'briefing').length).toBeGreaterThan(0);
  });

  it('writes a briefing from the day and the next deadline', () => {
    const plan = planReminders(
      [
        item({ id: 'lec', title: 'Psych lecture', date: '2026-10-20', start: '09:00', end: '10:15' }),
        item({ id: 'todo', kind: 'task', title: 'Buy notebook', date: '2026-10-20' }),
        item({ id: 'exam', title: 'Stats exam', date: '2026-10-22', isDeadline: true }),
      ],
      { ...DEFAULT_REMINDERS, enabled: false },
      now,
    );
    const b = plan.find((p) => p.id === 'brief-2026-10-20')!;
    expect(b.time).toBe('08:00');
    expect(b.body).toBe('2 things today: Psych lecture 9–10:15 am; 1 to-do. Stats exam Thursday.');
    expect(plan.some((p) => p.id === 'brief-2026-10-25')).toBe(false);
  });

  it('knows quiet hours across midnight', () => {
    expect(inQuietHours('23:30', DEFAULT_REMINDERS)).toBe(true);
    expect(inQuietHours('06:59', DEFAULT_REMINDERS)).toBe(true);
    expect(inQuietHours('07:00', DEFAULT_REMINDERS)).toBe(false);
    expect(inQuietHours('12:00', DEFAULT_REMINDERS)).toBe(false);
  });
});
