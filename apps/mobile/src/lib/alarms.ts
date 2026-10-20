import { requireOptionalNativeModule } from 'expo';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { planRingingAlarms } from './alarm-plan';
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
      const { items, settings } = useStore.getState();
      const requests = settings.reminders.urgentAlarmsEnabled ? planRingingAlarms(Object.values(items)) : [];
      const scheduledIDs = await native.syncAsync(JSON.stringify(requests));
      publish({ scheduledIDs, error: null });
    } finally { publish({ syncing: false }); }
  }).catch((error: unknown) => {
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
  const authorization = await native.requestAuthorizationAsync();
  publish({ authorization });
  if (authorization !== 'authorized') return;
  const store = useStore.getState();
  store.setSettings({ reminders: { ...store.settings.reminders, urgentAlarmsEnabled: true } });
  await syncRingingAlarms();
}

export async function disableRingingAlarms(): Promise<void> {
  const store = useStore.getState();
  store.setSettings({ reminders: { ...store.settings.reminders, urgentAlarmsEnabled: false } });
  await syncRingingAlarms();
}
