import { useEffect } from 'react';

import { adoptSnapshot, choosePlan, snapshotOf, type Snapshot } from './cloud-snapshot';
import { reportError } from './errors';
import { accountOf, supabase, useSession } from './supabase';
import { useStore } from '../store';

/*
 * Backup, not live sync: the phone is the source of truth while signed in, and every change is
 * saved back a few seconds later. Signing in never merges two plans (see choosePlan): one side
 * wins, and when both have a plan the person picks which to keep. Undo history stays on the phone.
 */

/** After sign-in: take the account's plan, back up this phone's, or ask which to keep. */
export async function restoreFromCloud(): Promise<{ restored: boolean }> {
  if (!supabase) return { restored: false };
  // Read the session directly: right after sign-in the listener may not have run yet.
  const { data: auth } = await supabase.auth.getSession();
  useSession.setState({ session: auth.session, ready: true });
  const userId = accountOf(auth.session)?.user.id;
  if (!userId) return { restored: false };
  const { data, error } = await supabase.from('plans').select('data, updated_at').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  const stored = data?.data as Snapshot | undefined;
  const remote = stored?.version === 1 ? stored : null;
  const choice = choosePlan(useStore.getState(), remote);
  if (choice === 'ask' && remote) {
    // Nothing is saved until the person keeps one, so neither plan can overwrite the other.
    useStore.setState({ planChoice: { remote, remoteAt: (data?.updated_at as string | undefined) ?? null } });
    return { restored: false };
  }
  // Neither side has a plan: the account's profile (name, studies, setup state) still comes along.
  if (remote && (choice === 'remote' || choice === 'none')) useStore.setState(adoptSnapshot(useStore.getState(), remote));
  await saveToCloud(true);
  return { restored: choice === 'remote' };
}

/** "Keep account plan": this phone's plan is replaced by the account's. */
export async function keepAccountPlan(): Promise<void> {
  const pending = useStore.getState().planChoice;
  if (!pending) return;
  useStore.setState({ ...adoptSnapshot(useStore.getState(), pending.remote), batches: [], planChoice: null });
  await saveToCloud(true);
}

/** "Keep this iPhone's plan": the account's backup is overwritten with this phone's plan. */
export async function keepPhonePlan(): Promise<void> {
  if (!useStore.getState().planChoice) return;
  useStore.setState({ planChoice: null });
  await saveToCloud(true);
}

let lastSaved = '';

export async function saveToCloud(force = false): Promise<void> {
  const userId = accountOf(useSession.getState().session)?.user.id;
  // While the person is choosing between two plans, saving would decide for them.
  if (!supabase || !userId || useStore.getState().planChoice) return;
  const snapshot = snapshotOf(useStore.getState());
  const json = JSON.stringify(snapshot);
  if (!force && json === lastSaved) return;
  const { error } = await supabase.from('plans').upsert({ user_id: userId, data: snapshot, updated_at: new Date().toISOString() });
  if (error) throw error;
  lastSaved = json;
  const { settings, setSettings } = useStore.getState();
  setSettings({ cloud: { ...settings.cloud, backedUpAt: new Date().toISOString(), error: null } });
}

const SAVE_DELAY_MS = 4000;
const BACKUP_FAILED = 'Couldn’t back up. We’ll try again after your next change.';

function noteBackupFailure(error: unknown) {
  reportError('cloud.backup', error);
  const { settings, setSettings } = useStore.getState();
  // Setting the same message twice would schedule another save; set it once.
  if (settings.cloud.error !== BACKUP_FAILED) setSettings({ cloud: { ...settings.cloud, error: BACKUP_FAILED } });
}

/** While signed in, save a few seconds after the plan changes. Failures wait for the next change. */
export function CloudBackup() {
  const userId = useSession((s) => accountOf(s.session)?.user.id);
  useEffect(() => {
    if (!userId) return;
    lastSaved = '';
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = useStore.subscribe((s, prev) => {
      if (!s.hydrated || (s.items === prev.items && s.courses === prev.courses && s.schedules === prev.schedules && s.taskWorkDates === prev.taskWorkDates && s.settings === prev.settings)) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void saveToCloud().catch(noteBackupFailure);
      }, SAVE_DELAY_MS);
    });
    return () => { unsubscribe(); if (timer) clearTimeout(timer); };
  }, [userId]);
  return null;
}
