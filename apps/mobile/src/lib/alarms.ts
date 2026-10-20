import { requireOptionalNativeModule } from 'expo';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { planRingingAlarms } from './alarm-plan';
import { reportError } from './errors';
import { getPlusStatus, onPlusStatus } from './plus-status';
import { useStore } from '../store';

type Authorization = 'checking' | 'authorized' | 'denied' | 'notDetermined' | 'unsupported' | 'needs-build';
type NativeAlarms = {
  getStatusAsync: () => Promise<Authorization>;
  requestAuthorizationAsync: () => Promise<Authorization>;
  syncAsync: (requestsJSON: string) => Promise<string[]>;
};
type AlarmState = { authorization: Authorization; scheduledIDs: string[]; syncing: boolean; error: string | null };
const listeners = new Set<() => void>();
let snapshot: AlarmState = { authorization: Platform.OS === 'ios' ? 'checking' : 'unsupported', scheduledIDs: [], syncing: false, error: null };
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const getSnapshot = () => snapshot;
const publish = (patch: Partial<AlarmState>) => { snapshot = { ...snapshot, ...patch }; listeners.forEach((listener) => listener()); };
const nativeModule = () => Platform.OS === 'ios' ? requireOptionalNativeModule<NativeAlarms>('SemliAlarms') : null;
let queue: Promise<void> = Promise.resolve();

export function useAlarmState() { return useSyncExternalStore(subscribe, getSnapshot, getSnapshot); }

export function syncRingingAlarms(): Promise<void> {
  const next = queue.then(async () => {
    publish({ syncing: true });
    try {
      const native = nativeModule();
      if (!native) { publish({ authorization: Platform.OS === 'ios' ? 'needs-build' : 'unsupported', scheduledIDs: [], error: null }); return; }
      const authorization = await native.getStatusAsync();
      publish({ authorization });
      if (authorization !== 'authorized') { publish({ scheduledIDs: [], error: null }); return; }
      // Ringing alarms are part of Plus. Until the store has answered, leave the alarms as they are.
      const plus = getPlusStatus();
      if (plus === 'unknown') return;
      const { items, settings } = useStore.getState();
      const requests = settings.reminders.urgentAlarmsEnabled && plus === 'active' ? planRingingAlarms(Object.values(items)) : [];
      const scheduledIDs = await native.syncAsync(JSON.stringify(requests));
      publish({ scheduledIDs, error: null });
    } finally { publish({ syncing: false }); }
  }).catch((error: unknown) => {
    reportError('alarms.synchronize', error);
    // Never claim a new alarm is armed after a partial native failure.
    publish({ scheduledIDs: [], error: 'We couldn’t update ringing alarms. Try again before relying on this alarm.' });
    throw error;
  });
  queue = next.catch(() => {});
  return next;
}

export async function enableRingingAlarms(): Promise<void> {
  const native = nativeModule();
  if (!native) throw new Error('A new iOS development build is needed for ringing alarms.');
  if (getPlusStatus() !== 'active') throw new Error('Urgent ringing alarms are part of Semli Plus.');
  const authorization = await native.requestAuthorizationAsync();
  publish({ authorization });
  if (authorization !== 'authorized') return;
  const store = useStore.getState();
  store.setSettings({ reminders: { ...store.settings.reminders, urgentAlarmsEnabled: true } });
  await syncRingingAlarms();
}

// A purchase, restore or lapse changes what may ring; bring the native alarms in line.
onPlusStatus(() => { void syncRingingAlarms().catch(() => {}); });

export async function disableRingingAlarms(): Promise<void> {
  const store = useStore.getState();
  store.setSettings({ reminders: { ...store.settings.reminders, urgentAlarmsEnabled: false } });
  await syncRingingAlarms();
}
