import { describe, expect, it } from 'vitest';

import { applyRecords, diffRecords, keyOf, latestSeq, recordsOf, snapshotFromRecords, type StoredRecord } from './sync-records';

const item = (id: string, over: object = {}) => ({ id, kind: 'task', title: id, category: 'school', icon: 'check', date: '2026-10-20', start: null, end: null, isDeadline: false, done: false, completedAt: null, courseId: null, employer: null, sourceId: null, batchId: null, notes: null, createdAt: '2026-10-01T00:00:00Z', ...over });
const course = (id: string) => ({ id, code: id.toUpperCase(), title: id, instructor: null, sourceId: null });
const plan = (over: object = {}) => ({
  items: {} as Record<string, ReturnType<typeof item>>, courses: [] as ReturnType<typeof course>[], schedules: [], taskWorkDates: {} as Record<string, string>,
  settings: { name: 'Ama', onboarded: true, isStudent: true, appearance: 'system' },
  ...over,
}) as never;

describe('recordsOf', () => {
  it('makes one record per item, course, work date, and one profile, leaving samples on the device', () => {
    const records = recordsOf(plan({ items: { a: item('a'), s: item('s', { sourceId: 'sample' }) }, courses: [course('bio')], taskWorkDates: { a: '2026-10-19' } }));
    expect([...records.keys()].sort()).toEqual(['course:bio', 'item:a', 'profile:me', 'workdate:a']);
    expect(records.get('workdate:a')!.data).toEqual({ date: '2026-10-19' });
    expect(records.get('profile:me')!.data).toMatchObject({ settings: { name: 'Ama' }, onboarded: true });
  });

  it('keeps this device’s own preferences out of the profile', () => {
    const profile = recordsOf(plan()).get('profile:me')!.data as { settings: Record<string, unknown> };
    expect(profile.settings).not.toHaveProperty('appearance');
  });
});

describe('diffRecords', () => {
  it('sends only what changed, and a deletion for what’s gone', () => {
    const a = item('a');
    const before = recordsOf(plan({ items: { a, b: item('b') } }));
    const after = recordsOf(plan({ items: { a, c: item('c') } }));
    const changes = diffRecords(before, after);
    expect(changes.map((r) => [keyOf(r), r.deleted])).toEqual([['item:c', false], ['item:b', true]]);
    expect(changes.find((r) => r.deleted)!.data).toBeNull();
  });

  it('sees an edit even when the object is new but the same, and ignores a copy that changed nothing', () => {
    const before = recordsOf(plan({ items: { a: item('a') } }));
    expect(diffRecords(before, recordsOf(plan({ items: { a: item('a') } })))).toEqual([]);
    expect(diffRecords(before, recordsOf(plan({ items: { a: item('a', { done: true }) } }))).map(keyOf)).toEqual(['item:a']);
  });

  it('notices a profile change', () => {
    const before = recordsOf(plan());
    const after = recordsOf(plan({ settings: { name: 'Ama B', onboarded: true } }));
    expect(diffRecords(before, after).map(keyOf)).toEqual(['profile:me']);
  });
});

describe('applyRecords', () => {
  it('applies another device’s edits and deletions, touching only the fields that changed', () => {
    const local = plan({ items: { a: item('a'), b: item('b') }, courses: [course('bio'), course('chem')] });
    const patch = applyRecords(local, [
      { kind: 'item', id: 'a', data: item('a', { done: true }), deleted: false },
      { kind: 'item', id: 'b', data: null, deleted: true },
      { kind: 'course', id: 'bio', data: { ...course('bio'), title: 'Biology' }, deleted: false },
    ])!;
    expect(Object.keys(patch).sort()).toEqual(['courses', 'items']);
    expect(Object.keys(patch.items!)).toEqual(['a']);
    expect((patch.items!.a as { done: boolean }).done).toBe(true);
    // Courses keep their order, so fallback tints don't shift.
    expect(patch.courses!.map((c) => c.title)).toEqual(['Biology', 'chem']);
  });

  it('finishes onboarding from another device but never undoes it', () => {
    const fresh = plan({ settings: { name: '', onboarded: false } });
    expect(applyRecords(fresh, [{ kind: 'profile', id: 'me', data: { settings: { name: 'Ama' }, onboarded: true }, deleted: false }])!.settings)
      .toMatchObject({ name: 'Ama', onboarded: true, seeded: true });
    expect(applyRecords(plan(), [{ kind: 'profile', id: 'me', data: { settings: {}, onboarded: false }, deleted: false }])!.settings)
      .toMatchObject({ onboarded: true });
  });

  it('sets and clears planned work dates', () => {
    const patch = applyRecords(plan({ taskWorkDates: { a: '2026-10-19' } }), [
      { kind: 'workdate', id: 'a', data: null, deleted: true },
      { kind: 'workdate', id: 'b', data: { date: '2026-10-21' }, deleted: false },
    ])!;
    expect(patch.taskWorkDates).toEqual({ b: '2026-10-21' });
  });
});

describe('snapshotFromRecords and latestSeq', () => {
  it('rebuilds the plan sign-in compares, skipping deletions', () => {
    const rows: StoredRecord[] = [
      { kind: 'item', id: 'a', data: item('a'), deleted: false, seq: 4 },
      { kind: 'item', id: 'b', data: null, deleted: true, seq: 9 },
      { kind: 'profile', id: 'me', data: { settings: { name: 'Ama' }, onboarded: true }, deleted: false, seq: 2 },
    ];
    const snapshot = snapshotFromRecords(rows);
    expect(snapshot.items.map((i) => i.id)).toEqual(['a']);
    expect(snapshot).toMatchObject({ settings: { name: 'Ama' }, onboarded: true });
    expect(latestSeq(rows)).toBe(9);
    expect(latestSeq([], 3)).toBe(3);
  });

  it('round-trips a plan through records', () => {
    const local = plan({ items: { a: item('a') }, courses: [course('bio')], taskWorkDates: { a: '2026-10-19' } });
    const snapshot = snapshotFromRecords([...recordsOf(local).values()]);
    expect(snapshot.items.map((i) => i.id)).toEqual(['a']);
    expect(snapshot.courses.map((c) => c.id)).toEqual(['bio']);
    expect(snapshot.taskWorkDates).toEqual({ a: '2026-10-19' });
  });
});
