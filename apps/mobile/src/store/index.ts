import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CommitPlan } from '@dayli/core';
import type { Course, Extraction, Item, ScheduleVersion } from '@dayli/schema';
import { COURSE_TINTS, type TintName } from '@dayli/tokens';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_API_URL } from '@/lib/api';
import { profileFor } from '@/lib/majors';
import { SAMPLE_SOURCE, sampleWeek } from '@/store/sample';

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
}

export interface Pending {
  extraction: Extraction;
  /** Human label for where this came from, e.g. "Screenshot" or "syllabus.pdf". */
  source: string;
}

export type PlanId = 'monthly' | 'semester' | 'yearly';
export type Appearance = 'system' | 'light' | 'dark';
export type StoredCourse = Course & { batchId?: string; color?: TintName };

interface Settings {
  name: string;
  apiUrl: string;
  seeded: boolean;
  onboarded: boolean;
  /** Honor system: we never verify student status. */
  isStudent: boolean;
  /** Legacy beta preference only. Never use this to grant paid access; check RevenueCat semli_pro. */
  planIntent: PlanId | null;
  weekKinds: string[];
  appearance: Appearance;
  /** UI sounds; they also follow the ring/silent switch. */
  sounds: boolean;
  haptics: boolean;
  /** Field of study when isStudent; drives the sample week and onboarding copy. */
  major: string | null;
}

/** AI imports used this calendar month (free tier allows a few). */
interface Usage {
  month: string;
  imports: number;
}

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

  setHydrated: () => void;
  setPending: (p: Pending | null) => void;
  showToast: (message: string, batchId?: string) => void;
  hideToast: () => void;
  setSettings: (patch: Partial<Settings>) => void;
  recordImport: () => void;
  planTasks: (ids: string[], date: string) => void;
  unplanTask: (id: string) => void;
  dismissSuggestion: (id: string, date: string) => void;
  setCaptureDraft: (text: string) => void;
  setSelectedPlanDate: (date: string) => void;

  toggleDone: (id: string) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  removeItem: (id: string) => void;
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'batchId'>) => string;
  applyPlan: (plan: CommitPlan, label: string, extra?: { source?: string; course?: Course }) => string;
  undoBatch: (id: string) => void;

  loadSample: () => void;
  clearAll: () => void;
}

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
      settings: { name: '', apiUrl: DEFAULT_API_URL, seeded: false, onboarded: false, isStudent: true, planIntent: null, weekKinds: [], appearance: 'system', sounds: true, haptics: true, major: null },
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
      dismissSuggestion: (id, date) => {
        const previous = get().suggestionDismissals;
        set({ suggestionDismissals: { date, ids: [...new Set([...(previous.date === date ? previous.ids : []), id])] } });
      },
      recordImport: () => {
        const month = nowIso().slice(0, 7);
        const u = get().usage;
        set({ usage: { month, imports: u.month === month ? u.imports + 1 : 1 } });
      },

      toggleDone: (id) => {
        const it = get().items[id];
        if (!it) return;
        const done = !it.done;
        set({ items: { ...get().items, [id]: { ...it, done, completedAt: done ? nowIso() : null } } });
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
        const courses = extra?.course
          ? [...get().courses, { ...extra.course, batchId: b.id, color: COURSE_TINTS[get().courses.length % COURSE_TINTS.length] }]
          : get().courses;
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
        set({
          items,
          schedules: get().schedules.filter((s) => s.batchId !== id),
          courses: get().courses.filter((c) => c.batchId !== id),
          batches: get().batches.map((x) => (x.id === id ? { ...x, undone: true } : x)),
          toast: null,
        });
      },

      loadSample: () => {
        const today = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const date = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
        const { major, isStudent } = get().settings;
        const s = sampleWeek(date, profileFor(major, isStudent), isStudent);
        set({
          items: { ...get().items, ...Object.fromEntries(s.items.map((i) => [i.id, i])) },
          courses: [...get().courses.filter((c) => c.sourceId !== SAMPLE_SOURCE), ...s.courses.map((k, i) => ({ ...k, color: COURSE_TINTS[i % COURSE_TINTS.length] }))],
          schedules: [...get().schedules.filter((c) => c.sourceId !== SAMPLE_SOURCE), ...s.schedules],
          settings: { ...get().settings, seeded: true },
        });
      },

      clearAll: () => set({ items: {}, courses: [], schedules: [], batches: [], pending: null, toast: null, taskWorkDates: {}, suggestionDismissals: { date: '', ids: [] }, captureDraft: '', selectedPlanDate: null }),
    }),
    {
      name: 'semli',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ items: s.items, courses: s.courses, schedules: s.schedules, batches: s.batches, settings: s.settings, usage: s.usage, taskWorkDates: s.taskWorkDates, suggestionDismissals: s.suggestionDismissals }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return { ...current, ...p, settings: { ...current.settings, ...(p.settings ?? {}) } };
      },
      onRehydrateStorage: () => (state) => state?.setHydrated(),
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
    () => Object.values(items).sort((a, b) => a.date.localeCompare(b.date) || (a.start ?? '').localeCompare(b.start ?? '')),
    [items],
  );
}
