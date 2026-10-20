import type { Item, ScheduleVersion } from '@dayli/schema';

import { realRecords } from './planner-preview';
import type { StoredCourse, useStore } from '../store';

/* The backup's shape and the sign-in merge, kept free of native imports so they can be tested. */

type State = ReturnType<typeof useStore.getState>;
type Settings = State['settings'];

/** Settings that describe the person, not this phone. */
const PERSONAL = ['name', 'isStudent', 'major', 'weekKinds', 'lms', 'canvas', 'reminders', 'breaks', 'planIntent'] as const;

export interface Snapshot {
  version: 1;
  items: Item[];
  courses: StoredCourse[];
  schedules: (ScheduleVersion & { batchId?: string })[];
  taskWorkDates: Record<string, string>;
  settings: Partial<Pick<Settings, (typeof PERSONAL)[number]>>;
  /** Whether the account ever finished onboarding. Missing in rows saved before Oct 20, 2026. */
  onboarded?: boolean;
}

export function snapshotOf(s: Pick<State, 'items' | 'courses' | 'schedules' | 'taskWorkDates' | 'settings'>): Snapshot {
  return {
    version: 1,
    items: realRecords(Object.values(s.items)),
    courses: realRecords(s.courses),
    schedules: realRecords(s.schedules),
    taskWorkDates: s.taskWorkDates,
    settings: Object.fromEntries(PERSONAL.map((k) => [k, s.settings[k]])),
    onboarded: s.settings.onboarded,
  };
}

/**
 * Every sign-in saves a row, so a row alone doesn't mean the account was set up: someone who
 * signed up and stopped at the code has an empty one. Older rows carry no flag; a plan stands in.
 */
export function finishedOnboarding(remote: Snapshot): boolean {
  if (typeof remote.onboarded === 'boolean') return remote.onboarded;
  return remote.items.length > 0 || remote.courses.length > 0 || remote.schedules.length > 0;
}

/**
 * Union by id, and the phone wins any record both sides have. A phone that never finished
 * onboarding (a new install) takes the stored profile, and skips onboarding only when the
 * account finished it somewhere else; otherwise onboarding runs with the profile filled in.
 */
export function mergeSnapshot(local: Pick<State, 'items' | 'courses' | 'schedules' | 'taskWorkDates' | 'settings'>, remote: Snapshot) {
  const items = { ...Object.fromEntries(remote.items.map((i) => [i.id, i])), ...local.items };
  const byId = <T extends { id: string }>(mine: T[], theirs: T[]) => [...mine, ...theirs.filter((t) => !mine.some((m) => m.id === t.id))];
  const fresh = !local.settings.onboarded;
  return {
    items,
    courses: byId(local.courses, remote.courses),
    schedules: byId(local.schedules, remote.schedules),
    taskWorkDates: { ...remote.taskWorkDates, ...local.taskWorkDates },
    settings: fresh
      ? finishedOnboarding(remote) ? { ...local.settings, ...remote.settings, onboarded: true, seeded: true } : { ...local.settings, ...remote.settings }
      : local.settings,
  };
}
