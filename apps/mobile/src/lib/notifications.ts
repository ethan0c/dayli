import { localParts } from '@dayli/core';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { track } from '@/lib/analytics';
import { planReminders, type PlannedNotification } from '@/lib/reminder-plan';
import { useStore } from '@/store';

/** Show reminders while the app is open too; a reminder you can't see is not a reminder. */
export function configureNotifications() {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

export async function notificationsAllowed(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

/** Ask once, in context (after the first confirmed import). Returns whether reminders can fire. */
export async function requestNotifications(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: true } });
  track('reminders_permission', { granted: next.granted });
  return next.granted;
}

function triggerFor(p: PlannedNotification): Notifications.DateTriggerInput {
  const [y, m, d] = p.date.split('-').map(Number);
  const [hh, mm] = p.time.split(':').map(Number);
  return { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(y!, m! - 1, d!, hh!, mm!, 0) };
}

let lastSignature = '';

/**
 * Replace every pending local notification with the current plan. Idempotent: the same
 * plan is not rescheduled, so this can run on every store change.
 */
export async function syncReminders(): Promise<number> {
  if (Platform.OS === 'web') return 0;
  const { items, settings } = useStore.getState();
  const allowed = await notificationsAllowed();
  const plan = allowed ? planReminders(Object.values(items), settings.reminders, localParts(new Date())) : [];
  const signature = JSON.stringify(plan.map((p) => [p.id, p.date, p.time, p.body]));
  if (signature === lastSignature) return plan.length;
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const p of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: p.id,
      content: { title: p.title, body: p.body, sound: 'default', data: { itemId: p.itemId, kind: p.kind } },
      trigger: triggerFor(p),
    });
  }
  lastSignature = signature;
  return plan.length;
}

/** Fire a sample reminder in a few seconds, so the settings page can prove it works. */
export async function sendTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Stats exam 2 is tomorrow', body: 'Due Friday at 9:00 am. A good evening to get ahead.', sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 },
  });
}

/** Keeps the schedule in step with the plan: on changes to items or preferences, and when the app returns. */
export function useReminderSync() {
  const items = useStore((s) => s.items);
  const reminders = useStore((s) => s.settings.reminders);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void syncReminders().catch(() => {}), 1500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [items, reminders]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && void syncReminders().catch(() => {}));
    return () => sub.remove();
  }, []);
}
