import { describe, expect, it } from 'vitest';
import type { Item } from '@dayli/schema';
import { deadlineReason, deadlineWindow, featuredCommitment, nowSummary, overdueTasks, startTodaySuggestions, todayItems, tomorrowSummary } from '../src/today';

const date = '2026-10-19';
const now = { date, time: '10:00' };
const item = (patch: Partial<Item> & Pick<Item, 'id'>): Item => ({
  kind: 'task', title: patch.id, category: 'school', icon: 'check', date, start: null, end: null,
  isDeadline: false, done: false, completedAt: null, courseId: null, employer: null,
  sourceId: null, batchId: null, notes: null, createdAt: '2026-10-19T00:00:00Z', ...patch,
});
const event = (patch: Partial<Item> & Pick<Item, 'id'>) => item({ kind: 'event', start: '09:00', end: '11:00', ...patch });

describe('the Today work plan', () => {
  it('brings an overdue task into today without changing its original deadline or time', () => {
    const overdue = Object.freeze(item({ id: 'essay', date: '2026-10-18', start: '17:00', isDeadline: true }));
    const items = [overdue];
    expect(overdueTasks(items, date).map((i) => i.id)).toEqual(['essay']);
    expect(todayItems(items, date)).toEqual([]);
    const workDates = { essay: date };
    expect(todayItems(items, date, workDates)[0]).toBe(overdue);
    expect(overdueTasks(items, date, workDates)).toEqual([]);
    expect(overdue.date).toBe('2026-10-18');
    expect(overdue.start).toBe('17:00');
    // The unfinished work comes back to Still open on the next day.
    expect(overdueTasks(items, '2026-10-20', workDates)).toEqual([overdue]);
  });

  it('includes only tasks in overdue recovery and keeps completed items at the end of Today', () => {
    const items = [event({ id: 'old-event', date: '2026-10-18' }), item({ id: 'done-old', date: '2026-10-18', done: true }),
      item({ id: 'done', done: true, start: '07:00' }), item({ id: 'untimed' }), event({ id: 'timed', start: '15:00' }), item({ id: 'old', date: '2026-10-18' })];
    expect(overdueTasks(items, date).map((i) => i.id)).toEqual(['old']);
    expect(todayItems(items, date, { old: date }).map((i) => i.id)).toEqual(['timed', 'old', 'untimed', 'done']);
  });

  it('does not duplicate a task whose original and work dates are both today', () => {
    const task = item({ id: 'one' });
    expect(todayItems([task], date, { one: date })).toEqual([task]);
  });

  it('includes an overnight event on its ending date, but not an event ending at midnight', () => {
    const overnight = event({ id: 'shift', date: '2026-10-18', start: '22:00', end: '06:00' });
    const midnight = event({ id: 'midnight', date: '2026-10-18', start: '20:00', end: '00:00' });
    expect(todayItems([overnight, midnight], date)).toEqual([overnight]);
  });
});

describe('now and next', () => {
  it('features a current commitment before a later event and changes at the exact end', () => {
    const current = event({ id: 'Lecture', end: '10:30' });
    const next = event({ id: 'Lab', start: '10:30', end: '12:00' });
    const list = Object.freeze([next, current]);
    expect(featuredCommitment([...list], now)).toEqual({ item: current, ongoing: true });
    expect(featuredCommitment([...list], { date, time: '10:30' })).toEqual({ item: next, ongoing: true });
    expect(list[0]).toBe(next);
  });

  it('keeps overnight commitments visible and does not feature tasks, all-day, or completed items', () => {
    const overnight = event({ id: 'Night shift', date: '2026-10-18', start: '22:00', end: '06:00' });
    expect(featuredCommitment([overnight], { date, time: '02:00' })).toEqual({ item: overnight, ongoing: true });
    expect(featuredCommitment([item({ id: 'Task', start: '11:00' }), event({ id: 'All day', start: null, end: null }), { ...overnight, done: true }], now)).toBeNull();
  });

  it('does not invent an ongoing duration when the end is unknown', () => {
    const unknown = event({ id: 'Unknown end', start: '09:00', end: null });
    const next = event({ id: 'Next', start: '12:00', end: null });
    expect(featuredCommitment([unknown, next], now)).toEqual({ item: next, ongoing: false });
    expect(featuredCommitment([unknown, next], { date, time: '12:00' })).toBeNull();
  });

  it('shows the current event followed by the next fixed event, ignoring tasks', () => {
    const items = [event({ id: 'Lecture', end: '10:50' }), item({ id: 'Essay', start: '11:00' }), event({ id: 'Shift', start: '16:00', end: '22:00' })];
    expect(nowSummary(items, now)).toBe('Lecture until 10:50 am · next: Shift at 4 pm');
  });

  it('handles exact event boundaries and events without end times', () => {
    const items = [event({ id: 'Ended', start: '08:00', end: '10:00' }), event({ id: 'Unknown end', start: '09:00', end: null }), event({ id: 'Next', start: '12:00', end: '13:00' })];
    expect(nowSummary(items, now)).toBe('Next: Next at 12 pm');
    expect(nowSummary([], now)).toBe('No more timed events today.');
  });

  it('handles overnight shifts, completed events, and overlapping events', () => {
    const shift = event({ id: 'Night shift', date: '2026-10-18', start: '22:00', end: '06:00' });
    expect(nowSummary([shift], { date, time: '02:00' })).toBe('Night shift until 6 am');
    expect(nowSummary([{ ...shift, done: true }], { date, time: '02:00' })).toBe('No more timed events today.');
    expect(nowSummary([event({ id: 'A' }), event({ id: 'B', start: '09:30', end: '12:00' })], now)).toContain('1 overlapping event');
  });
});

describe('calendar pressure and recommendations', () => {
  it('unions overlapping events so calendar gaps and work hours are not counted twice', () => {
    const deadline = item({ id: 'Due', start: '18:00', isDeadline: true });
    const items = [deadline, event({ id: 'Work', category: 'work', start: '10:00', end: '16:00' }), event({ id: 'Class', start: '14:00', end: '17:00' })];
    expect(deadlineWindow(items, deadline, now)).toEqual({ unbookedHours: 1, workHours: 6, hasUnknownTimes: false });
    expect(deadlineReason(items, deadline, now)).toContain('about 1 unbooked hour');
  });

  it('counts previous-day overnight blocks, clips at now, and includes exams as booked time', () => {
    const deadline = item({ id: 'Due', start: '12:00', isDeadline: true });
    const items = [deadline, event({ id: 'Overnight', date: '2026-10-18', start: '22:00', end: '08:00' }), event({ id: 'Exam', start: '09:00', end: '11:00', isDeadline: true })];
    expect(deadlineWindow(items, deadline, { date, time: '06:00' }).unbookedHours).toBe(2);
    expect(deadlineWindow(items, deadline, { date, time: '10:00' }).unbookedHours).toBe(1);
  });

  it('does not invent an exact due time or claim availability when event times are missing', () => {
    const deadline = item({ id: 'Due', date: '2026-10-20', isDeadline: true });
    expect(deadlineReason([deadline], deadline, now)).toBe('Due tomorrow · some times aren’t set yet.');
    const timed = { ...deadline, start: '12:00' };
    expect(deadlineWindow([timed, event({ id: 'Unknown', start: null, end: null })], timed, now).hasUnknownTimes).toBe(true);
  });

  it('ranks a deadline with booked shifts ahead of one on the same day without shift pressure', () => {
    const nearer = item({ id: 'near', date: '2026-10-21', start: '09:00', isDeadline: true });
    const later = item({ id: 'later', date: '2026-10-21', start: '18:00', isDeadline: true });
    const shift = event({ id: 'shift', date: '2026-10-21', category: 'work', start: '10:00', end: '17:00' });
    const suggestions = startTodaySuggestions([later, nearer, shift], now);
    expect(suggestions.map((s) => s.item.id)).toEqual(['later', 'near']);
    expect(suggestions[0]!.reason).toContain('7 hours of work booked');
  });

  it('limits recommendations to two and excludes done, overdue, already planned, or dismissed items', () => {
    const items = [item({ id: 'done', date: '2026-10-20', done: true, isDeadline: true }),
      item({ id: 'overdue', date: '2026-10-18', isDeadline: true }), item({ id: 'planned', date: '2026-10-20', isDeadline: true }),
      item({ id: 'dismissed', date: '2026-10-20', isDeadline: true }),
      ...['a', 'b', 'c'].map((id) => item({ id, date: '2026-10-20', isDeadline: true }))];
    expect(startTodaySuggestions(items, now, { planned: date }, ['dismissed']).map((s) => s.item.id)).toEqual(['a', 'b']);
    // Dismissal does not remove the source record or its due date.
    expect(items.find((i) => i.id === 'dismissed')?.date).toBe('2026-10-20');
  });

  it('does not fill the home screen with distant low-pressure deadlines', () => {
    const deadline = item({ id: 'next-week', date: '2026-10-25', start: '17:00', isDeadline: true });
    expect(startTodaySuggestions([deadline], now)).toEqual([]);
  });
});

describe('tomorrow peek', () => {
  it('appears only from 6 pm and includes fixed events, deadlines and intentionally scheduled tasks', () => {
    const items = [event({ id: 'Lecture', date: '2026-10-20' }), item({ id: 'Essay', date: '2026-10-20', isDeadline: true }),
      item({ id: 'Old task', date: '2026-10-17' }), item({ id: 'Done', date: '2026-10-20', done: true })];
    expect(tomorrowSummary(items, { date, time: '17:59' })).toBeNull();
    expect(tomorrowSummary(items, { date, time: '18:00' }, { 'Old task': '2026-10-20' })).toBe('Tomorrow: Lecture at 9 am · Essay due · Old task');
  });

  it('handles empty days and truncates long schedules', () => {
    expect(tomorrowSummary([], { date, time: '18:00' })).toBe('Tomorrow has no plans yet.');
    const items = ['a', 'b', 'c', 'd'].map((id) => item({ id, date: '2026-10-20' }));
    expect(tomorrowSummary(items, { date, time: '18:00' })).toContain('+1 more');
  });
});
