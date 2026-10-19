import { describe, expect, it } from 'vitest';
import type { Extraction, Item } from '@dayli/schema';
import {
  addDays,
  diffSchedule,
  findConflicts,
  findOverloads,
  formatRange,
  formatTime,
  isLocalDate,
  pendingDates,
  planCommit,
  relativeDay,
  toDrafts,
  weekOf,
  weekdayOf,
} from '../src';

function item(p: Partial<Item> & Pick<Item, 'id' | 'date'>): Item {
  return {
    kind: 'event',
    title: 'x',
    category: 'personal',
    icon: 'calendar',
    start: null,
    end: null,
    isDeadline: false,
    done: false,
    completedAt: null,
    courseId: null,
    employer: null,
    sourceId: null,
    batchId: null,
    notes: null,
    createdAt: '2026-10-19T00:00:00Z',
    ...p,
  };
}

describe('dates', () => {
  it('knows weekdays and weeks', () => {
    expect(weekdayOf('2026-10-19')).toBe('mon');
    expect(weekdayOf('2026-10-25')).toBe('sun');
    expect(weekOf('2026-10-22')).toEqual([
      '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25',
    ]);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('validates dates', () => {
    expect(isLocalDate('2026-02-29')).toBe(false);
    expect(isLocalDate('2028-02-29')).toBe(true);
    expect(isLocalDate('10/20/2026')).toBe(false);
  });
  it('formats times', () => {
    expect(formatTime('16:00')).toBe('4:00 pm');
    expect(formatTime('00:30')).toBe('12:30 am');
    expect(formatRange('16:00', '22:00')).toBe('4–10 pm');
    expect(formatRange('11:00', '17:00')).toBe('11 am–5 pm');
    expect(relativeDay('2026-10-20', '2026-10-20')).toBe('Today');
    expect(relativeDay('2026-10-20', '2026-10-21')).toBe('Tomorrow');
    expect(relativeDay('2026-10-20', '2026-10-19')).toBe('Yesterday');
    expect(relativeDay('2026-10-20', '2026-10-23')).toBe('In 3 days');
  });
});

describe('diffSchedule', () => {
  const old = [
    item({ id: 'a', date: '2026-10-27', start: '16:00', end: '22:00' }),
    item({ id: 'b', date: '2026-10-30', start: '16:00', end: '22:00' }),
    item({ id: 'c', date: '2026-10-31', start: '11:00', end: '17:00' }),
  ];
  it('classifies new, changed, removed, unchanged', () => {
    const d = diffSchedule(old, [
      { date: '2026-10-27', start: '16:00', end: '22:00' },
      { date: '2026-10-29', start: '11:00', end: '17:00' },
      { date: '2026-10-30', start: '17:00', end: '23:00' },
    ]);
    expect(d.unchanged.map((u) => u.before.id)).toEqual(['a']);
    expect(d.changed.map((c) => [c.before.id, c.after.start])).toEqual([['b', '17:00']]);
    expect(d.added.map((a) => a.date)).toEqual(['2026-10-29']);
    expect(d.removed.map((r) => r.id)).toEqual(['c']);
  });
  it('pairs double shifts by overlap', () => {
    const d = diffSchedule(
      [item({ id: 'am', date: '2026-11-01', start: '09:00', end: '13:00' }), item({ id: 'pm', date: '2026-11-01', start: '17:00', end: '22:00' })],
      [{ date: '2026-11-01', start: '17:30', end: '22:00' }, { date: '2026-11-01', start: '09:00', end: '13:00' }],
    );
    expect(d.unchanged.map((u) => u.before.id)).toEqual(['am']);
    expect(d.changed.map((c) => c.before.id)).toEqual(['pm']);
  });
});

describe('conflicts and overload', () => {
  it('finds overlapping events, including overnight shifts', () => {
    const c = findConflicts([
      item({ id: 'shift', date: '2026-10-29', start: '22:00', end: '06:00' }),
      item({ id: 'clinical', date: '2026-10-30', start: '05:30', end: '14:00' }),
      item({ id: 'task', kind: 'task', date: '2026-10-30', start: '06:00', end: null }),
    ]);
    expect(c).toEqual([{ a: 'shift', b: 'clinical', minutes: 30 }]);
  });
  it('flags a deadline with too little free time before it', () => {
    const items = [
      item({ id: 'exam', date: '2026-10-26', start: '09:00', end: '11:00', isDeadline: true }),
      item({ id: 's1', date: '2026-10-24', start: '07:00', end: '23:00' }),
      item({ id: 's2', date: '2026-10-25', start: '07:00', end: '21:00' }),
    ];
    const o = findOverloads(items, { date: '2026-10-23', time: '23:30' });
    // From Fri night: Sun 21–23 (2h) + Mon 07–09 (2h) free = 4h, which is not under the 4h threshold.
    expect(o).toEqual([]);
    const o2 = findOverloads(items, { date: '2026-10-24', time: '06:00' });
    expect(o2).toEqual([]);
    const o3 = findOverloads([...items, item({ id: 's3', date: '2026-10-26', start: '07:00', end: '08:30' })], { date: '2026-10-24', time: '06:00' });
    expect(o3).toEqual([{ deadlineId: 'exam', freeHours: 2.5 }]);
  });
  it('lists dates without a published schedule', () => {
    expect(pendingDates([{ coversFrom: '2026-10-19', coversTo: '2026-10-25' }], '2026-10-24', '2026-10-27')).toEqual([
      '2026-10-26',
      '2026-10-27',
    ]);
  });
});

describe('drafts and commit planning', () => {
  const base = {
    is_deadline: false,
    repeat_weekdays: [] as never[],
    repeat_until: null,
    course_code: null,
    evidence: '',
    confidence: 0.95,
    question: null,
  };
  it('expands repeating classes and flags bad dates', () => {
    const ex: Extraction = {
      detected_type: 'syllabus',
      employer: null,
      course: { code: 'NUR 410', title: 'Adult Health', instructor: null },
      covers_from: null,
      covers_to: null,
      items: [
        { ...base, kind: 'event', title: 'Adult Health lecture', category: 'school', date: '2026-10-20', start: '09:00', end: '10:15', repeat_weekdays: ['tue', 'thu'], repeat_until: '2026-10-31' },
        { ...base, kind: 'task', title: 'Care plan', category: 'school', date: '2026-02-30', start: null, end: null },
      ],
    };
    const drafts = toDrafts(ex, '2026-10-19');
    expect(drafts.filter((d) => d.title === 'Adult Health lecture').map((d) => d.date)).toEqual([
      '2026-10-20', '2026-10-22', '2026-10-27', '2026-10-29',
    ]);
    const bad = drafts.find((d) => d.title === 'Care plan')!;
    expect(bad.date).toBeNull();
    expect(bad.needsInput).toBe(true);
  });
  it('turns a schedule import into creates, updates, and removes', () => {
    const existing = [
      item({ id: 'b', date: '2026-10-30', start: '16:00', end: '22:00', category: 'work', employer: 'Olive Garden' }),
      item({ id: 'c', date: '2026-10-31', start: '11:00', end: '17:00', category: 'work', employer: 'Olive Garden' }),
      item({ id: 'other', date: '2026-10-31', start: '11:00', end: '17:00', category: 'work', employer: 'Target' }),
    ];
    const ex: Extraction = {
      detected_type: 'work_schedule',
      employer: 'Olive Garden',
      course: null,
      covers_from: '2026-10-26',
      covers_to: '2026-11-01',
      items: [
        { ...base, kind: 'event', title: 'Olive Garden shift', category: 'work', date: '2026-10-27', start: '16:00', end: '22:00' },
        { ...base, kind: 'event', title: 'Olive Garden shift', category: 'work', date: '2026-10-30', start: '17:00', end: '23:00' },
      ],
    };
    const plan = planCommit(ex, toDrafts(ex, '2026-10-19'), existing, () => null);
    expect(plan.create.map((c) => c.date)).toEqual(['2026-10-27']);
    expect(plan.update).toEqual([{ id: 'b', patch: { start: '17:00', end: '23:00' } }]);
    expect(plan.remove).toEqual(['c']);
  });
  it('skips exact duplicates', () => {
    const existing = [item({ id: 'x', kind: 'task', title: 'Buy scrubs', date: '2026-10-21' })];
    const ex: Extraction = {
      detected_type: 'general', employer: null, course: null, covers_from: null, covers_to: null,
      items: [{ ...base, kind: 'task', title: 'Buy scrubs', category: 'personal', date: '2026-10-21', start: null, end: null }],
    };
    const plan = planCommit(ex, toDrafts(ex, '2026-10-19'), existing, () => null);
    expect(plan.create).toEqual([]);
    expect(plan.skipped).toBe(1);
  });
});
