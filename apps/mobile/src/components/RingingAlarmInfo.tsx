import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { TextButton } from '@/components/Controls';
import { T } from '@/components/Text';
import { disableRingingAlarms, enableRingingAlarms, syncRingingAlarms, useAlarmState } from '@/lib/alarms';
import { openSystemSettings } from '@/lib/links';
import { useStore } from '@/store';
import { useTheme } from '@/theme';

export function RingingAlarmInfo({ timed = true, itemID, draft = false, settings = false }: {
  timed?: boolean; itemID?: string; draft?: boolean; settings?: boolean;
}) {
  const { c } = useTheme();
  const state = useAlarmState();
  const enabled = useStore((s) => !!s.settings.reminders.urgentAlarmsEnabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void syncRingingAlarms().catch(() => {}); }, []);
  const unavailable = state.syncing || state.authorization === 'checking' || state.authorization === 'unsupported' || state.authorization === 'needs-build';
  const armed = itemID && state.scheduledIDs.includes(itemID);
  const message = !timed ? 'Add a time to set a ringing alarm.'
    : state.syncing ? 'Updating ringing alarms…'
    : state.authorization === 'checking' ? 'Checking ringing alarm access…'
    : state.authorization === 'needs-build' ? 'Update Semli to use ringing alarms. This item is still marked urgent.'
    : state.authorization === 'unsupported' ? 'Ringing alarms are available on iOS 26 or later. Urgent labels and standard reminders still work.'
    : state.authorization === 'denied' ? 'Allow Alarms for Semli in system Settings to enable ringing alarms.'
    : !enabled || state.authorization !== 'authorized' ? 'Enable ringing alarms to ring at the time of urgent events and to-dos. Stop the alarm from the system alarm screen.'
    : settings ? 'Ringing alarms are on for timed urgent items. They work separately from ordinary reminders. The nearest 32 alarms are kept scheduled.'
    : draft ? 'Saving this timed urgent item will set a ringing alarm.'
    : armed ? 'Ringing alarm set. Use Stop on the system alarm screen to dismiss it.'
    : 'No ringing alarm is set for this item. Check that its time is in the future, or try again.';

  async function act() {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      if (state.error) await syncRingingAlarms();
      else if (state.authorization === 'denied') { if (!(await openSystemSettings())) setError('Open Settings → Semli → Alarms.'); }
      else if (enabled && settings) await disableRingingAlarms();
      else if (enabled && state.authorization === 'authorized') await syncRingingAlarms();
      else await enableRingingAlarms();
    } catch { setError('We couldn’t update ringing alarms. Please try again.'); }
    finally { setBusy(false); }
  }
  return <View style={{ gap: 6, paddingVertical: 10 }}>
    <T token="caption" color={c.inkSecondary}>{message}</T>
    {state.error || error ? <T token="caption" color={c.conflict} accessibilityRole="alert">{error ?? state.error}</T> : null}
    {!unavailable && timed && (!draft || !enabled || state.authorization !== 'authorized') && (!armed || settings || !enabled) ? <TextButton
      label={busy ? 'One moment…' : state.error ? 'Retry alarm setup' : state.authorization === 'denied' ? 'Open alarm settings' : enabled && settings ? 'Turn off ringing alarms' : enabled ? 'Retry alarm setup' : 'Enable ringing alarms'}
      onPress={() => void act()} tone="muted" style={{ alignSelf: 'flex-start' }} /> : null}
  </View>;
}
