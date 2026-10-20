import { useEffect } from 'react';

import { mergeSnapshot, snapshotOf, type Snapshot } from './cloud-snapshot';
import { reportError } from './errors';
import { accountOf, supabase, useSession } from './supabase';
import { useStore } from '../store';

/*
 * Backup, not live sync: the phone is the source of truth. Signing in merges the stored plan
 * into this phone (nothing local is lost), then every change is saved back a few seconds later.
 * Undo history stays on the phone.
 */

/** After sign-in: pull the stored plan into this phone, then save the merged result. */
export async function restoreFromCloud(): Promise<{ restored: boolean }> {
  if (!supabase) return { restored: false };
  // Read the session directly: right after sign-in the listener may not have run yet.
  const { data: auth } = await supabase.auth.getSession();
  useSession.setState({ session: auth.session, ready: true });
  const userId = accountOf(auth.session)?.user.id;
  if (!userId) return { restored: false };
  const { data, error } = await supabase.from('plans').select('data').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  const remote = data?.data as Snapshot | undefined;
  if (remote?.version === 1) useStore.setState(mergeSnapshot(useStore.getState(), remote));
  await saveToCloud(true);
  return { restored: !!remote && remote.items.length > 0 };
}

let lastSaved = '';

export async function saveToCloud(force = false): Promise<void> {
  const userId = accountOf(useSession.getState().session)?.user.id;
  if (!supabase || !userId) return;
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
        void saveToCloud().catch((error: unknown) => {
          reportError('cloud.backup', error);
          const { settings, setSettings } = useStore.getState();
          // Setting the same message twice would schedule another save; set it once.
          if (settings.cloud.error !== BACKUP_FAILED) setSettings({ cloud: { ...settings.cloud, error: BACKUP_FAILED } });
        });
      }, SAVE_DELAY_MS);
    });
    return () => { unsubscribe(); if (timer) clearTimeout(timer); };
  }, [userId]);
  return null;
}
