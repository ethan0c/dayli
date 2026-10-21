import type { Item, ScheduleVersion } from '@dayli/schema';

import { realRecords } from './planner-preview';
import type { StoredCourse, useStore } from '../store';

/* The backup's shape and the sign-in merge, kept free of native imports so they can be tested. */

type State = ReturnType<typeof useStore.getState>;
type Settings = State['settings'];

/** Settings that describe the person, not this phone. */
const PERSONAL = ['name', 'isStudent', 'major', 'weekKinds', 'lms', 'canvas', 'reminders', 'breaks', 'planIntent', 'region', 'termSystem'] as const;

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

type Plan = Pick<State, 'items' | 'courses' | 'schedules' | 'taskWorkDates' | 'settings'>;

/** Whether a side holds anything the person made (samples don't count). */
function hasPlan(p: { items: Item[]; courses: unknown[]; schedules: unknown[] }): boolean {
  return realRecords(p.items).length > 0 || p.courses.length > 0 || p.schedules.length > 0;
}

/**
 * What signing in does with the two plans. Never merge: merging two people's plans on a shared
 * phone was how one account's classes ended up in another's backup.
 * - `remote`: only the account has a plan, so this phone takes it.
 * - `local`: only this phone has one (a guest backing up), so the account takes it.
 * - `ask`: both do; the person keeps one and the other is replaced.
 * - `none`: neither does.
 */
export function choosePlan(local: Plan, remote: Snapshot | null | undefined): 'remote' | 'local' | 'ask' | 'none' {
  const mine = hasPlan({ items: realRecords(Object.values(local.items)), courses: realRecords(local.courses), schedules: realRecords(local.schedules) });
  const theirs = !!remote && hasPlan(remote);
  if (mine && theirs) return 'ask';
  if (theirs) return 'remote';
  return mine ? 'local' : 'none';
}

/** The newest thing on a plan, for "a plan from Oct 12": the latest item created. */
export function planDate(items: Item[]): string | null {
  return items.reduce<string | null>((latest, i) => (!latest || i.createdAt > latest ? i.createdAt : latest), null);
}

/**
 * This phone takes the account's plan in place of its own. A phone that never finished onboarding
 * (a new install) skips it only when the account finished it somewhere else; the person's
 * settings come from the account, and this phone's own preferences (appearance, sounds) stay.
 */
export function adoptSnapshot(local: Plan, remote: Snapshot) {
  const done = finishedOnboarding(remote);
  return {
    items: Object.fromEntries(remote.items.map((i) => [i.id, i])),
    courses: remote.courses,
    schedules: remote.schedules,
    taskWorkDates: remote.taskWorkDates,
    settings: { ...local.settings, ...remote.settings, ...(done ? { onboarded: true, seeded: true } : {}) },
  };
}
