import { describe, expect, it } from 'vitest';
import type { Item } from '@dayli/schema';
import { adoptSnapshot, choosePlan, planDate, snapshotOf } from './cloud-snapshot';

const item = (id: string, over: Partial<Item> = {}): Item => ({
  id, kind: 'task', title: id, category: 'school', icon: 'check', date: '2026-10-20', start: null, end: null, isDeadline: false,
  done: false, completedAt: null, courseId: null, employer: null, sourceId: null, batchId: null, notes: null, createdAt: '2026-10-01T00:00:00Z', ...over,
});

const settings = { name: '', onboarded: true, seeded: true, isStudent: true, major: null, weekKinds: [], lms: null, canvas: { feedUrl: null, lastSyncedAt: null, lastError: null }, reminders: {}, breaks: [], planIntent: null, appearance: 'dark' } as never;
const state = (items: Item[], over: object = {}) => ({ items: Object.fromEntries(items.map((i) => [i.id, i])), courses: [], schedules: [], taskWorkDates: {}, settings: { ...(settings as object), ...over } as never });

describe('cloud backup', () => {
  it('leaves sample records and phone-only settings out of the backup', () => {
    const snap = snapshotOf(state([item('a'), item('s', { sourceId: 'sample' })]));
    expect(snap.items.map((i) => i.id)).toEqual(['a']);
    expect(snap.settings).not.toHaveProperty('appearance');
    expect(snap.settings).not.toHaveProperty('onboarded');
  });

  it('never merges two plans: both sides with a plan means the person chooses', () => {
    const remote = snapshotOf(state([item('a'), item('b')]));
    expect(choosePlan(state([item('c')]), remote)).toBe('ask');
  });

  it('a guest backing up gives the account its plan, a new phone takes the account plan', () => {
    const empty = snapshotOf(state([]));
    expect(choosePlan(state([item('c')]), empty)).toBe('local');
    expect(choosePlan(state([item('c')]), null)).toBe('local');
    expect(choosePlan(state([]), snapshotOf(state([item('a')])))).toBe('remote');
    expect(choosePlan(state([]), empty)).toBe('none');
  });

  it('sample records on the phone do not count as a plan', () => {
    expect(choosePlan(state([item('s', { sourceId: 'sample' })]), snapshotOf(state([item('a')])))).toBe('remote');
  });

  it('adopting the account plan replaces the phone plan instead of adding to it', () => {
    const remote = snapshotOf(state([item('a', { title: 'cloud' })]));
    const adopted = adoptSnapshot(state([item('a', { title: 'phone' }), item('c')]), remote);
    expect(Object.keys(adopted.items)).toEqual(['a']);
    expect(adopted.items.a!.title).toBe('cloud');
  });

  it('dates a plan by its newest item', () => {
    expect(planDate([item('a', { createdAt: '2026-10-01T00:00:00Z' }), item('b', { createdAt: '2026-10-12T00:00:00Z' })])).toBe('2026-10-12T00:00:00Z');
    expect(planDate([])).toBeNull();
  });

  it('a new phone takes the stored profile and skips onboarding the account finished', () => {
    const remote = snapshotOf(state([item('a')], { name: 'Ama', major: 'nursing' }));
    expect(remote.onboarded).toBe(true);
    const adopted = adoptSnapshot(state([], { onboarded: false, name: '' }), remote);
    expect(adopted.settings).toMatchObject({ onboarded: true, seeded: true, name: 'Ama', major: 'nursing', appearance: 'dark' });
  });

  it('a new phone still runs onboarding for an account that stopped at the code', () => {
    // Every sign-in saves a row, so the row of someone who never finished onboarding is empty.
    const remote = snapshotOf(state([], { onboarded: false, name: 'Ama' }));
    expect(remote.onboarded).toBe(false);
    const adopted = adoptSnapshot(state([], { onboarded: false, seeded: false, name: '' }), remote);
    expect(adopted.settings).toMatchObject({ onboarded: false, seeded: false, name: 'Ama' });
  });

  it('reads rows saved before the flag by whether they hold a plan', () => {
    const { onboarded: _legacy, ...empty } = snapshotOf(state([], { onboarded: true }));
    expect(adoptSnapshot(state([], { onboarded: false }), empty).settings.onboarded).toBe(false);
    const { onboarded: _legacyPlan, ...plan } = snapshotOf(state([item('a')], { onboarded: true }));
    expect(adoptSnapshot(state([], { onboarded: false }), plan).settings.onboarded).toBe(true);
  });
});
