import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { adoptSnapshot, choosePlan, type Snapshot } from './cloud-snapshot';
import { pullRecords, pushRecords, readLegacyPlan } from './cloud-store';
import { reportError } from './errors';
import { accountOf, supabase, useSession } from './supabase';
import { applyRecords, diffRecords, keyOf, latestSeq, recordsOf, sameRecord, snapshotFromRecords, type PlanRecord, type StoredRecord } from './sync-records';
import { useStore } from '../store';

/*
 * Sync, one record at a time: an item, a course, a schedule, a planned work date, the profile.
 * Each device pushes what changed a moment after the change, pulls everything newer than the
 * last `seq` it saw, and listens live while open, so a phone and a laptop can both edit. Signing
 * in still never merges two plans (see choosePlan): one side wins, and when both have a plan the
 * person picks which to keep. Undo history stays on the device that made the change.
 */

type Sync = {
  userId: string;
  /** The last server `seq` this device has applied. */
  cursor: number;
  /** Changes made here that the server hasn't confirmed, by `kind:id`. */
  pending: Map<string, PlanRecord>;
  /** The records as of the last change seen, to tell what the next change touched. */
  baseline: Map<string, PlanRecord>;
};

let sync: Sync | null = null;
let stopLive: (() => void) | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let flushing: Promise<void> | null = null;
/** Set while another device's records are written into the store, so they aren't sent back. */
let applying = false;
/** While the person picks between two plans: where the account's records stand. */
let choiceCursor: { cursor: number; fromRecords: boolean } | null = null;

const STORAGE_KEY = 'semli.sync';
const PUSH_DELAY_MS = 1000;
const SYNC_FAILED = 'Couldn’t sync. We’ll try again after your next change.';

/** The account's plan: its records, or the old whole-plan backup when it has none yet. */
async function readAccountPlan(userId: string): Promise<{ snapshot: Snapshot; at: string | null; cursor: number; fromRecords: boolean } | null> {
  const rows = await pullRecords(userId, 0);
  const cursor = latestSeq(rows);
  const live = rows.filter((r) => !r.deleted);
  if (live.length) {
    const at = rows.reduce<string | null>((latest, r) => (r.updated_at && (!latest || r.updated_at > latest) ? r.updated_at : latest), null);
    return { snapshot: snapshotFromRecords(live), at, cursor, fromRecords: true };
  }
  const legacy = await readLegacyPlan(userId);
  return legacy ? { ...legacy, cursor, fromRecords: false } : null;
}

/** After sign-in: take the account's plan, upload this device's, or ask which to keep. */
export async function restoreFromCloud(): Promise<{ restored: boolean }> {
  if (!supabase) return { restored: false };
  // Read the session directly: right after sign-in the listener may not have run yet.
  const { data: auth } = await supabase.auth.getSession();
  useSession.setState({ session: auth.session, ready: true });
  const userId = accountOf(auth.session)?.user.id;
  if (!userId) return { restored: false };
  stopSync();
  const remote = await readAccountPlan(userId);
  const choice = choosePlan(useStore.getState(), remote?.snapshot);
  if (choice === 'ask' && remote) {
    // Nothing is saved until the person keeps one, so neither plan can overwrite the other.
    choiceCursor = { cursor: remote.cursor, fromRecords: remote.fromRecords };
    useStore.setState({ planChoice: { remote: remote.snapshot, remoteAt: remote.at } });
    return { restored: false };
  }
  // Neither side has a plan: the account's profile (name, studies, setup state) still comes along.
  if (remote && (choice === 'remote' || choice === 'none')) useStore.setState(adoptSnapshot(useStore.getState(), remote.snapshot));
  // Records the account already holds needn't go back up; anything else (an old backup, this device's plan) does.
  await begin(userId, remote?.cursor ?? 0, choice === 'remote' && remote?.fromRecords ? [] : null);
  return { restored: choice === 'remote' };
}

/** "Keep account plan": this device's plan is replaced by the account's. */
export async function keepAccountPlan(): Promise<void> {
  const pending = useStore.getState().planChoice;
  const userId = accountOf(useSession.getState().session)?.user.id;
  if (!pending || !userId) return;
  const at = choiceCursor ?? { cursor: 0, fromRecords: false };
  choiceCursor = null;
  useStore.setState({ ...adoptSnapshot(useStore.getState(), pending.remote), batches: [], planChoice: null });
  await begin(userId, at.cursor, at.fromRecords ? [] : null);
}

/** "Keep this device's plan": the account's records are replaced with this device's plan. */
export async function keepPhonePlan(): Promise<void> {
  const userId = accountOf(useSession.getState().session)?.user.id;
  if (!useStore.getState().planChoice || !userId) return;
  choiceCursor = null;
  useStore.setState({ planChoice: null });
  // Read again: the account's other devices may have written since the question was asked.
  const rows = await pullRecords(userId, 0);
  const local = recordsOf(useStore.getState());
  const gone = rows.filter((r) => !r.deleted && !local.has(keyOf(r))).map((r): PlanRecord => ({ kind: r.kind, id: r.id, data: null, deleted: true }));
  await begin(userId, latestSeq(rows), null, gone);
}

/**
 * Start syncing this account from the current plan. `upload` null sends every local record (a
 * first upload); a list sends just those. `extra` adds records to send, such as deletions.
 */
async function begin(userId: string, cursor: number, upload: PlanRecord[] | null, extra: PlanRecord[] = []): Promise<void> {
  const baseline = recordsOf(useStore.getState());
  const pending = new Map<string, PlanRecord>();
  for (const r of upload ?? baseline.values()) pending.set(keyOf(r), r);
  for (const r of extra) pending.set(keyOf(r), r);
  sync = { userId, cursor, pending, baseline };
  startLive();
  await flush();
}

/** Resume on launch for an account that was already signed in. */
export async function resumeSync(userId: string): Promise<void> {
  const saved = await loadSaved();
  if (saved?.userId === userId) {
    sync = { userId, cursor: saved.cursor, pending: new Map(saved.pending.map((r) => [keyOf(r), r])), baseline: recordsOf(useStore.getState()) };
    startLive();
    await flush();
    await pull();
    return;
  }
  // The first sync on this device (an update from the backup-only version): join the account's
  // records, sending only what the account doesn't have. A record the account has wins.
  const rows = await pullRecords(userId, 0);
  const known = new Set(rows.map(keyOf));
  apply(rows);
  const local = recordsOf(useStore.getState());
  await begin(userId, latestSeq(rows), [...local.values()].filter((r) => !known.has(keyOf(r))));
}

/** Writes another device's records into the store, skipping any this device has changed since. */
function apply(rows: StoredRecord[]): void {
  const s = sync;
  const base = s?.baseline ?? recordsOf(useStore.getState());
  const fresh = rows.filter((r) => {
    const key = keyOf(r);
    if (s?.pending.has(key)) return false;
    const mine = base.get(key);
    return r.deleted ? !!mine : !sameRecord(mine, r);
  });
  const patch = applyRecords(useStore.getState(), fresh);
  if (!patch) return;
  applying = true;
  try { useStore.setState(patch); } finally { applying = false; }
  if (s) s.baseline = recordsOf(useStore.getState());
}

/** Everything newer than the cursor. */
async function pull(): Promise<void> {
  const s = sync;
  if (!s) return;
  const rows = await pullRecords(s.userId, s.cursor);
  if (sync !== s) return;
  apply(rows);
  s.cursor = latestSeq(rows, s.cursor);
  persist();
}

/** Sends this device's unconfirmed changes. One send at a time; a change made during one waits for the next. */
async function flush(): Promise<void> {
  if (flushing) await flushing.catch(() => undefined);
  const s = sync;
  if (!s || !s.pending.size) return;
  const batch = [...s.pending.values()];
  flushing = (async () => {
    await pushRecords(s.userId, batch);
    for (const r of batch) if (s.pending.get(keyOf(r)) === r) s.pending.delete(keyOf(r));
    persist();
    const { settings, setSettings } = useStore.getState();
    setSettings({ cloud: { ...settings.cloud, backedUpAt: new Date().toISOString(), error: null } });
  })();
  try { await flushing; } finally { flushing = null; }
}

/** Sign-out sends what's left first; a failure keeps the person signed in. */
export async function saveToCloud(force = false): Promise<void> {
  const userId = accountOf(useSession.getState().session)?.user.id;
  // While the person is choosing between two plans, saving would decide for them.
  if (!supabase || !userId || useStore.getState().planChoice) return;
  if (sync?.userId !== userId) {
    if (force) await begin(userId, 0, null);
    return;
  }
  await flush();
}

function noteSyncFailure(error: unknown) {
  reportError('cloud.sync', error);
  const { settings, setSettings } = useStore.getState();
  // Setting the same message twice would schedule another save; set it once.
  if (settings.cloud.error !== SYNC_FAILED) setSettings({ cloud: { ...settings.cloud, error: SYNC_FAILED } });
}

function schedulePush() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void flush().catch(noteSyncFailure);
  }, PUSH_DELAY_MS);
}

/** Watch the store for local changes, the server for other devices' changes, and the app for focus. */
function startLive(): void {
  stopLive?.();
  const s = sync;
  if (!s || !supabase) return;
  const unsubscribe = useStore.subscribe((st, prev) => {
    if (applying || sync !== s || !st.hydrated || st.planChoice) return;
    if (st.items === prev.items && st.courses === prev.courses && st.schedules === prev.schedules && st.taskWorkDates === prev.taskWorkDates && st.settings === prev.settings) return;
    const next = recordsOf(st);
    const changes = diffRecords(s.baseline, next);
    s.baseline = next;
    if (!changes.length) return;
    for (const r of changes) s.pending.set(keyOf(r), r);
    persist();
    schedulePush();
  });
  const channel = supabase
    .channel(`plan-records:${s.userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'plan_records', filter: `user_id=eq.${s.userId}` }, (payload) => {
      // Live rows are applied but don't move the cursor: the next pull fetches anything committed out of order.
      const row = payload.new as StoredRecord | undefined;
      if (row?.kind && sync === s) apply([row]);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') void pull().catch(noteSyncFailure);
    });
  const focus = AppState.addEventListener('change', (state) => {
    if (state === 'active') void flush().then(pull).catch(noteSyncFailure);
  });
  stopLive = () => {
    unsubscribe();
    focus.remove();
    void supabase?.removeChannel(channel);
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = null;
    stopLive = null;
  };
}

/** Stops syncing (sign-out, or a different account signing in). `forget` drops what this device remembered. */
export function stopSync(forget = false): void {
  stopLive?.();
  sync = null;
  choiceCursor = null;
  if (forget) void AsyncStorage.removeItem(STORAGE_KEY).catch((error: unknown) => reportError('cloud.forget', error));
}

function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const s = sync;
    if (!s) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ userId: s.userId, cursor: s.cursor, pending: [...s.pending.values()] }))
      .catch((error: unknown) => reportError('cloud.remember', error));
  }, 300);
}

async function loadSaved(): Promise<{ userId: string; cursor: number; pending: PlanRecord[] } | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    reportError('cloud.recall', error);
    return null;
  }
}

/**
 * Resumes sync for an account that was signed in when the app opened. A sign-in later in the
 * session starts sync from `restoreFromCloud` instead, once the person's plan is settled.
 */
export function CloudBackup() {
  const ready = useSession((s) => s.ready);
  const userId = useSession((s) => accountOf(s.session)?.user.id);
  const launched = useRef(false);
  useEffect(() => {
    if (!ready) return;
    if (!launched.current) {
      launched.current = true;
      if (userId) void resumeSync(userId).catch(noteSyncFailure);
      return;
    }
    if (!userId) stopSync();
  }, [ready, userId]);
  useEffect(() => () => stopSync(), []);
  return null;
}
