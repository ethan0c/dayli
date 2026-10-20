import { describe, expect, it } from 'vitest';
import type { Item } from '@dayli/schema';
import { mergeSnapshot, snapshotOf } from './cloud-snapshot';

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

  it('keeps everything on the phone and adds what only the backup has', () => {
    const remote = snapshotOf(state([item('a', { title: 'old' }), item('b')]));
    const merged = mergeSnapshot(state([item('a', { title: 'new' }), item('c')]), remote);
    expect(Object.keys(merged.items).sort()).toEqual(['a', 'b', 'c']);
    expect(merged.items.a!.title).toBe('new');
  });

  it('a new phone takes the stored profile and skips onboarding the account finished', () => {
    const remote = snapshotOf(state([item('a')], { name: 'Ama', major: 'nursing' }));
    expect(remote.onboarded).toBe(true);
    const merged = mergeSnapshot(state([], { onboarded: false, name: '' }), remote);
    expect(merged.settings).toMatchObject({ onboarded: true, seeded: true, name: 'Ama', major: 'nursing', appearance: 'dark' });
  });

  it('a new phone still runs onboarding for an account that stopped at the code', () => {
    // Every sign-in saves a row, so the row of someone who never finished onboarding is empty.
    const remote = snapshotOf(state([], { onboarded: false, name: 'Ama' }));
    expect(remote.onboarded).toBe(false);
    const merged = mergeSnapshot(state([], { onboarded: false, seeded: false, name: '' }), remote);
    expect(merged.settings).toMatchObject({ onboarded: false, seeded: false, name: 'Ama' });
  });

  it('reads rows saved before the flag by whether they hold a plan', () => {
    const { onboarded: _legacy, ...empty } = snapshotOf(state([], { onboarded: true }));
    expect(mergeSnapshot(state([], { onboarded: false }), empty).settings.onboarded).toBe(false);
    const { onboarded: _legacyPlan, ...plan } = snapshotOf(state([item('a')], { onboarded: true }));
    expect(mergeSnapshot(state([], { onboarded: false }), plan).settings.onboarded).toBe(true);
  });

  it('an onboarded phone keeps its own settings', () => {
    const merged = mergeSnapshot(state([], { name: 'Phone' }), snapshotOf(state([], { name: 'Cloud' })));
    expect(merged.settings).toMatchObject({ name: 'Phone' });
  });
});
