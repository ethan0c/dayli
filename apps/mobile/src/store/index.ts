import type { CommitPlan, TermSystem } from '@dayli/core';
import type { Snapshot } from '@/lib/cloud-snapshot';
import type { ImportUsage } from '@/lib/plans';
import type { AppLanguage } from '@/lib/language';
import type { Course, Extraction, Item, ScheduleVersion } from '@dayli/schema';
import { COURSE_TINTS, type TintName } from '@dayli/tokens';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_API_URL } from '@/lib/api';
import { track } from '@/lib/analytics';
import { realRecords } from '@/lib/planner-preview';
import { DEFAULT_REMINDERS, type ReminderPrefs } from '@/lib/reminder-plan';
import { plannerLoadFailed, plannerStorage } from '@/lib/storage';

export interface Change {
  op: 'create' | 'update' | 'delete';
  before: Item | null;
  after: Item | null;
}

/** One undoable unit: an import, a manual edit, or a delete. */
export interface Batch {
  id: string;
  createdAt: string;
  label: string;
  changes: Change[];
  undone: boolean;
  /** Where it came from, for the import screen: "Screenshot", "syllabus.pdf", "Message". */
  source?: string | null;
  /** Courses and schedules this batch removed, so Undo can put them back. */
  removedCourses?: StoredCourse[];
  removedSchedules?: (ScheduleVersion & { batchId?: string })[];
  /** Work days this batch set, with what each task had before (null: none), so Undo can put them back. */
  workDatesBefore?: Record<string, string | null>;
}

export interface Pending {
  extraction: Extraction;
  /** Human label for where this came from, e.g. "Screenshot" or "syllabus.pdf". */
  source: string;
}

export type PlanId = 'monthly' | 'semester' | 'yearly';
export type Appearance = 'system' | 'light' | 'dark';
export type CardStyle = 'flat' | 'raised';
export type TodayView = 'list' | 'hours';
export type StoredCourse = Course & { batchId?: string; color?: TintName };

interface Settings {
  name: string;
  apiUrl: string;
  seeded: boolean;
  onboarded: boolean;
  /** Honor system: we never verify student status. */
  isStudent: boolean;
  /** Legacy beta preference only. Never use this to grant paid access; check RevenueCat semli_plus. */
  planIntent: PlanId | null;
  /** Legacy onboarding answer, kept so old backups load; nothing reads it. */
  weekKinds: string[];
  /** "What's on your plate?" from onboarding: drives student pricing, Today's view and the first import offered. */
  plate: Plate[];
  /** "Where do your deadlines live?" from onboarding: picks the first import path. */
  deadlineSource: DeadlineSource | null;
  /** The onboarding sample's batch, while it is in the plan; Today offers to remove it. */
  sampleBatchId: string | null;
  /** The guest's one-time "Save your plan" row on Today was dismissed. */
  savePlanDismissed: boolean;
  appearance: Appearance;
  /** This device's app language; null follows its preferred languages. Not synced to the account. */
  language: AppLanguage | null;
  /** Kept for stored settings; the app no longer draws cards. */
  cardStyle: CardStyle;
  /** The top-right toggle on Today: the list, or the day by the hour. */
  todayView: TodayView;
  /** UI sounds; they also follow the ring/silent switch. */
  sounds: boolean;
  haptics: boolean;
  /** Field of study when isStudent; drives the sample week and onboarding copy. */
  major: string | null;
  reminders: ReminderPrefs;
  /** The in-context permission ask after the first confirmed import happened. */
  remindersAsked: boolean;
  /** Semester breaks, for the moment header on Today. */
  breaks?: { label: string; start: string; end: string }[];
  /** Set by the review sheet when the first import is confirmed during onboarding. */
  onboardingImportDone: boolean;
  /** Active free trial, for the day-5 reminder. */
  trial: { endsAt: string; label: string } | null;
  /** Where the person studies, for the term calendar and numeric dates; null follows the phone. */
  region: string | null;
  /** Semesters or quarters, asked only where both are common (US, Canada). */
  termSystem: TermSystem;
  /** Where assignments live, asked in onboarding. Only Canvas syncs today; the rest is demand data. */
  lms: Lms | null;
  /** Account backup status, for You → Account. Nothing here is synced. */
  cloud: { backedUpAt: string | null; error: string | null };
  /** Canvas calendar feed sync. The link is the only credential; it stays on this phone. */
  canvas: CanvasSettings;
  /**
   * Things Semli explains once, the first time they happen in a person's own plan, instead of
   * in a tour. True once the note was seen; a guest's Clear everything resets them.
   */
  firsts: Record<FirstKind, boolean>;
}

/** What Semli explains once: an overlap it can move, a close deadline, Canvas left unconnected, a schedule compared with the last one, Plan's chart legend. */
export type FirstKind = 'overlap' | 'urgent' | 'canvas' | 'reimport' | 'hours' | 'week';

export type Lms = 'canvas' | 'blackboard' | 'brightspace' | 'moodle' | 'classroom' | 'other';
export type Plate = 'classes' | 'job' | 'clubs';
export type DeadlineSource = 'canvas' | 'syllabus' | 'screenshots' | 'nowhere';

export interface CanvasSettings {
  feedUrl: string | null;
  lastSyncedAt: string | null;
  /** The last failure, shown on the Canvas screen; cleared by the next good sync. */
  lastError: string | null;
}

/** AI imports used this calendar month (free tier allows a few). */
type Usage = ImportUsage;

interface State {
  hydrated: boolean;
  items: Record<string, Item>;
  courses: StoredCourse[];
  usage: Usage;
  schedules: (ScheduleVersion & { batchId?: string })[];
  batches: Batch[];
  pending: Pending | null;
  toast: { message: string; batchId?: string } | null;
  settings: Settings;
  /** User-chosen work dates. Item.date remains the source's event/due date. */
  taskWorkDates: Record<string, string>;
  suggestionDismissals: { date: string; ids: string[] };
  captureDraft: string;
  selectedPlanDate: string | null;
  /** Signed in while this phone and the account both had a plan: the account's, until the person keeps one. Not persisted. */
  planChoice: { remote: Snapshot; remoteAt: string | null } | null;

  setHydrated: () => void;
  setPending: (p: Pending | null) => void;
  showToast: (message: string, batchId?: string) => void;
  hideToast: () => void;
  setSettings: (patch: Partial<Settings>) => void;
  recordImport: () => void;
  planTasks: (ids: string[], date: string) => void;
  unplanTask: (id: string) => void;
  /** Gives several tasks their own start days as one undoable change. */
  spreadTasks: (steps: { id: string; date: string }[], label: string) => string;
  dismissSuggestion: (id: string, date: string) => void;
  setCaptureDraft: (text: string) => void;
  setSelectedPlanDate: (date: string) => void;

  toggleDone: (id: string) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  removeItem: (id: string) => void;
  /** Delete several at once as one undoable batch: a week of lectures, the rest of a series. */
  removeItems: (ids: string[], label: string) => void;
  /** Drop a course: the course and every item in it, one Undo. */
  removeCourse: (courseId: string) => void;
  /** Quit a job: upcoming shifts only, or everything including past shifts and the schedules. */
  removeEmployer: (employer: string, scope: 'upcoming' | 'all', today: string) => void;
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'batchId'>) => string;
  applyPlan: (plan: CommitPlan, label: string, extra?: { source?: string; course?: Course; courses?: Course[] }) => string;
  undoBatch: (id: string) => void;

  /**
   * `plan` erases what the person added (items, classes, shifts, breaks) and keeps their setup
   * answers. `everything` also resets those answers, so the next screen is the welcome; it keeps
   * only this device's preferences and the trial, which belong to the phone, not the person.
   */
  clearAll: (scope: 'plan' | 'everything') => void;
}

const DEFAULT_SETTINGS: Settings = { name: '', apiUrl: DEFAULT_API_URL, seeded: false, onboarded: false, isStudent: true, planIntent: null, weekKinds: [], plate: [], deadlineSource: null, sampleBatchId: null, savePlanDismissed: false, appearance: 'system', language: null, cardStyle: 'raised', todayView: 'list', sounds: true, haptics: true, major: null, reminders: DEFAULT_REMINDERS, remindersAsked: false, onboardingImportDone: false, trial: null, region: null, termSystem: 'semester', lms: null, cloud: { backedUpAt: null, error: null }, canvas: { feedUrl: null, lastSyncedAt: null, lastError: null }, firsts: { overlap: false, urgent: false, canvas: false, reimport: false, hours: false, week: false } };

export const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const nowIso = () => new Date().toISOString();

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      items: {},
      courses: [],
      schedules: [],
      batches: [],
      pending: null,
      toast: null,
      taskWorkDates: {},
      suggestionDismissals: { date: '', ids: [] },
      captureDraft: '',
      selectedPlanDate: null,
      planChoice: null,
      settings: DEFAULT_SETTINGS,
      usage: { month: '', imports: 0 },

      setHydrated: () => set({ hydrated: true }),
      setPending: (pending) => set({ pending }),
      showToast: (message, batchId) => set({ toast: { message, batchId } }),
      hideToast: () => set({ toast: null }),
      setSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      setCaptureDraft: (captureDraft) => set({ captureDraft }),
      setSelectedPlanDate: (selectedPlanDate) => set({ selectedPlanDate }),
      planTasks: (ids, date) => {
        const taskWorkDates = { ...get().taskWorkDates };
        for (const id of ids) {
          const item = get().items[id];
          if (item?.kind === 'task' && !item.done) taskWorkDates[id] = date;
        }
        set({ taskWorkDates });
      },
      unplanTask: (id) => {
        const taskWorkDates = { ...get().taskWorkDates };
        delete taskWorkDates[id];
        set({ taskWorkDates });
      },
      spreadTasks: (steps, label) => {
        const b: Batch = { ...batch(label, []), workDatesBefore: {} };
        const taskWorkDates = { ...get().taskWorkDates };
        for (const { id, date } of steps) {
          b.workDatesBefore![id] = taskWorkDates[id] ?? null;
          taskWorkDates[id] = date;
        }
        set({ taskWorkDates, batches: [b, ...get().batches] });
        return b.id;
      },
      dismissSuggestion: (id, date) => {
        const previous = get().suggestionDismissals;
        set({ suggestionDismissals: { date, ids: [...new Set([...(previous.date === date ? previous.ids : []), id])] } });
      },
      recordImport: () => {
        const month = nowIso().slice(0, 7);
        const u = get().usage;
        set({ usage: { month, imports: u.month === month ? u.imports + 1 : 1, firstImportAt: u.firstImportAt ?? new Date().toISOString(), total: (u.total ?? u.imports) + 1 } });
      },

      toggleDone: (id) => {
        const it = get().items[id];
        if (!it) return;
        const done = !it.done;
        set({ items: { ...get().items, [id]: { ...it, done, completedAt: done ? nowIso() : null } } });
        track('item_completion_changed', { item_kind: it.kind, category: it.category, completed: done });
      },

      updateItem: (id, patch) => {
        const before = get().items[id];
        if (!before) return;
        const after = { ...before, ...patch };
        set({
          items: { ...get().items, [id]: after },
          batches: [batch('Edited ' + before.title, [{ op: 'update', before, after }]), ...get().batches],
        });
      },

      removeItem: (id) => {
        const before = get().items[id];
        if (!before) return;
        const items = { ...get().items };
        delete items[id];
        const b = batch('Deleted ' + before.title, [{ op: 'delete', before, after: null }]);
        set({ items, batches: [b, ...get().batches], toast: { message: `Deleted ${before.title}.`, batchId: b.id } });
        track('item_deleted', { deletion_scope: 'single', item_count: 1 });
      },

      removeItems: (ids, label) => {
        const items = { ...get().items };
        const changes: Change[] = [];
        for (const id of ids) {
          const before = items[id];
          if (!before) continue;
          delete items[id];
          changes.push({ op: 'delete', before, after: null });
        }
        if (changes.length === 0) return;
        const b = batch(label, changes);
        set({ items, batches: [b, ...get().batches], toast: { message: `${label}.`, batchId: b.id } });
        track('item_deleted', { deletion_scope: 'multiple', item_count: changes.length });
      },

      removeCourse: (courseId) => {
        const course = get().courses.find((k) => k.id === courseId);
        if (!course) return;
        const items = { ...get().items };
        const changes: Change[] = [];
        for (const it of Object.values(items)) {
          if (it.courseId !== courseId) continue;
          delete items[it.id];
          changes.push({ op: 'delete', before: it, after: null });
        }
        const name = course.code ?? course.title;
        const b: Batch = { ...batch(`Removed ${name} · ${changes.length} ${changes.length === 1 ? 'thing' : 'things'}`, changes), removedCourses: [course] };
        set({ items, courses: get().courses.filter((k) => k.id !== courseId), batches: [b, ...get().batches], toast: { message: `${b.label}.`, batchId: b.id } });
        if (changes.length) track('item_deleted', { deletion_scope: 'course', item_count: changes.length });
      },

      removeEmployer: (employer, scope, today) => {
        const key = employer.trim().toLowerCase();
        const items = { ...get().items };
        const changes: Change[] = [];
        for (const it of Object.values(items)) {
          if ((it.employer ?? '').trim().toLowerCase() !== key) continue;
          if (scope === 'upcoming' && it.date < today) continue;
          delete items[it.id];
          changes.push({ op: 'delete', before: it, after: null });
        }
        const gone = get().schedules.filter((sch) => sch.employer.trim().toLowerCase() === key && (scope === 'all' || sch.coversTo >= today));
        const b: Batch = { ...batch(`Removed ${employer} · ${changes.length} ${changes.length === 1 ? 'shift' : 'shifts'}`, changes), removedSchedules: gone };
        set({ items, schedules: get().schedules.filter((sch) => !gone.includes(sch)), batches: [b, ...get().batches], toast: { message: `${b.label}.`, batchId: b.id } });
        if (changes.length) track('item_deleted', { deletion_scope: 'employer', item_count: changes.length });
      },

      addItem: (fields) => {
        const b = batch('Added ' + fields.title, []);
        const item: Item = { ...fields, id: newId(), createdAt: nowIso(), batchId: b.id };
        b.changes.push({ op: 'create', before: null, after: item });
        set({ items: { ...get().items, [item.id]: item }, batches: [b, ...get().batches] });
        return item.id;
      },

      applyPlan: (plan, label, extra) => {
        const b = batch(label, []);
        const items = { ...get().items };
        const source = extra?.source ?? null;
        for (const c of plan.create) {
          const it: Item = { ...c, id: newId(), createdAt: nowIso(), batchId: b.id, sourceId: source };
          items[it.id] = it;
          b.changes.push({ op: 'create', before: null, after: it });
        }
        for (const u of plan.update) {
          const before = items[u.id];
          if (!before) continue;
          const after: Item = { ...before, ...u.patch, batchId: b.id };
          items[u.id] = after;
          b.changes.push({ op: 'update', before, after });
        }
        for (const id of plan.remove) {
          const before = items[id];
          if (!before) continue;
          delete items[id];
          b.changes.push({ op: 'delete', before, after: null });
        }
        const schedules = plan.schedule
          ? [
              ...get().schedules,
              {
                id: newId(),
                employer: plan.schedule.employer,
                coversFrom: plan.schedule.coversFrom,
                coversTo: plan.schedule.coversTo,
                sourceId: source,
                createdAt: nowIso(),
                batchId: b.id,
              },
            ]
          : get().schedules;
        const courses = [...get().courses];
        for (const k of [...(extra?.course ? [extra.course] : []), ...(extra?.courses ?? [])]) {
          courses.push({ ...k, batchId: b.id, color: COURSE_TINTS[courses.length % COURSE_TINTS.length] });
        }
        b.source = source;
        set({ items, schedules, courses, batches: [b, ...get().batches], pending: null });
        return b.id;
      },

      undoBatch: (id) => {
        const b = get().batches.find((x) => x.id === id);
        if (!b || b.undone) return;
        const items = { ...get().items };
        for (const ch of [...b.changes].reverse()) {
          if (ch.op === 'create' && ch.after) delete items[ch.after.id];
          else if (ch.before) items[ch.before.id] = ch.before;
        }
        const taskWorkDates = { ...get().taskWorkDates };
        for (const [task, before] of Object.entries(b.workDatesBefore ?? {})) {
          if (before) taskWorkDates[task] = before;
          else delete taskWorkDates[task];
        }
        set({
          items,
          taskWorkDates,
          schedules: [...get().schedules.filter((s) => s.batchId !== id), ...(b.removedSchedules ?? [])],
          courses: [...get().courses.filter((c) => c.batchId !== id), ...(b.removedCourses ?? [])],
          batches: get().batches.map((x) => (x.id === id ? { ...x, undone: true } : x)),
          toast: null,
        });
      },

      clearAll: (scope) => {
        const { settings: s } = get();
        set({
          items: {}, courses: [], schedules: [], batches: [], pending: null, toast: null, taskWorkDates: {}, suggestionDismissals: { date: '', ids: [] }, captureDraft: '', selectedPlanDate: null, planChoice: null,
          settings: scope === 'plan'
            ? { ...s, breaks: [] }
            : { ...DEFAULT_SETTINGS, apiUrl: s.apiUrl, appearance: s.appearance, language: s.language, cardStyle: s.cardStyle, todayView: s.todayView, sounds: s.sounds, haptics: s.haptics, trial: s.trial },
        });
      },
    }),
    {
      name: 'semli',
      storage: createJSONStorage(() => plannerStorage),
      partialize: (s) => ({ items: s.items, courses: s.courses, schedules: s.schedules, batches: s.batches, settings: s.settings, usage: s.usage, taskWorkDates: s.taskWorkDates, suggestionDismissals: s.suggestionDismissals }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        // Nested records gain fields over time; a stored one must not drop the new defaults.
        return { ...current, ...p, settings: { ...current.settings, ...(p.settings ?? {}), firsts: { ...current.settings.firsts, ...(p.settings?.firsts ?? {}) } } };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) plannerLoadFailed(error);
        else state?.setHydrated();
      },
    },
  ),
);

function batch(label: string, changes: Change[]): Batch {
  return { id: newId(), createdAt: nowIso(), label, changes, undone: false };
}

/** A course's tint; older records without one take the next tint in order. */
export function courseTint(courses: StoredCourse[], courseId: string | null | undefined): TintName | null {
  if (!courseId) return null;
  const i = courses.findIndex((k) => k.id === courseId);
  if (i < 0) return null;
  return courses[i]!.color ?? COURSE_TINTS[i % COURSE_TINTS.length]!;
}

/** All items as a stable sorted array. */
export function useItemList(): Item[] {
  const items = useStore((s) => s.items);
  return useMemo(
    () => realRecords(Object.values(items)).sort((a, b) => a.date.localeCompare(b.date) || (a.start ?? '').localeCompare(b.start ?? '')),
    [items],
  );
}

/** Samples are presentation content, never course matches or schedule history. */
export function useCourseList(): StoredCourse[] {
  const courses = useStore((s) => s.courses);
  return useMemo(() => realRecords(courses), [courses]);
}

export function useScheduleList() {
  const schedules = useStore((s) => s.schedules);
  return useMemo(() => realRecords(schedules), [schedules]);
}
