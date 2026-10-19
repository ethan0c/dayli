import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { TimeField } from '@/components/Native';
import { Group, Row, ToggleRow } from '@/components/Settings';
import { T } from '@/components/Text';
import { track } from '@/lib/analytics';
import { feedback } from '@/lib/feedback';
import { notificationsAllowed, requestNotifications, sendTestNotification, syncReminders } from '@/lib/notifications';
import type { ReminderPrefs } from '@/lib/reminder-plan';
import { useStore } from '@/store';
import { SCREEN_GUTTER, radius, useTheme } from '@/theme';

const LEADS: ReminderPrefs['eventLead'][] = [10, 30, 60];

export default function RemindersScreen() {
  const { c } = useTheme();
  const prefs = useStore((s) => s.settings.reminders);
  const setSettings = useStore((s) => s.setSettings);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    void notificationsAllowed().then(setAllowed);
  }, []);

  const update = (patch: Partial<ReminderPrefs>) => {
    setSettings({ reminders: { ...prefs, ...patch } });
    track('reminders_changed', { enabled: patch.enabled ?? prefs.enabled, briefing: patch.briefing ?? prefs.briefing });
  };

  const enable = async () => {
    const ok = await requestNotifications();
    setAllowed(ok);
    if (ok) {
      update({ enabled: true });
      await syncReminders();
    }
  };

  const timeRow = (label: string, key: keyof Pick<ReminderPrefs, 'dayBeforeAt' | 'morningAt' | 'quietStart' | 'quietEnd' | 'briefingAt'>, last = false) => (
    <View style={[styles.row, !last ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line } : null]}>
      <T style={{ flex: 1 }}>{label}</T>
      <TimeField date={null} time={prefs[key]} onChange={(v) => v && update({ [key]: v } as Partial<ReminderPrefs>)} />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.body} contentInsetAdjustmentBehavior="automatic">
      {allowed === false ? (
        <Group footer="Semli needs permission to show reminders. Nothing is sent anywhere; they are scheduled on this phone.">
          <Row icon="bell" tint={c.tint.butter.fill} label="Turn on reminders" onPress={() => void enable()} last />
        </Group>
      ) : null}

      <Group title="Before things" footer="Reminders fire before timed events and twice before deadlines: the evening before and the morning of.">
        <ToggleRow icon="bell" tint={c.tint.butter.fill} label="Reminders" value={prefs.enabled} onChange={(enabled) => { feedback('select'); update({ enabled }); }} />
        <View style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line }]}>
          <T style={{ flex: 1 }}>Before an event</T>
          <View style={[styles.seg, { backgroundColor: c.canvas }]}>
            {LEADS.map((m) => {
              const on = prefs.eventLead === m;
              return (
                <Pressable key={m} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => { feedback('select'); update({ eventLead: m }); }} style={[styles.segItem, { backgroundColor: on ? c.inkPrimary : 'transparent' }]}>
                  <T token="subhead" color={on ? c.canvas : c.inkSecondary}>{m} min</T>
                </Pressable>
              );
            })}
          </View>
        </View>
        {timeRow('Evening before a deadline', 'dayBeforeAt')}
        {timeRow('Morning of a deadline', 'morningAt', true)}
      </Group>

      <Group title="Quiet hours" footer="Reminders that would land in quiet hours wait until they end, unless the event itself is sooner.">
        {timeRow('From', 'quietStart')}
        {timeRow('Until', 'quietEnd', true)}
      </Group>

      <Group title="Daily briefing" footer="One morning note with what's on today and the next deadline. Skipped on days with nothing on.">
        <ToggleRow icon="sparkle" tint={c.tint.sky.fill} label="Morning briefing" value={prefs.briefing} onChange={(briefing) => { feedback('select'); update({ briefing }); track('briefing_changed', { briefing }); }} />
        {timeRow('At', 'briefingAt', true)}
      </Group>

      <Group footer={sent ? 'Sent. It arrives in about five seconds, even with the app open.' : undefined}>
        <Row
          icon="tick"
          tint={c.tint.mint.fill}
          label="Send a test reminder"
          onPress={() => {
            feedback('tap');
            void requestNotifications().then((ok) => {
              setAllowed(ok);
              if (ok) {
                setSent(true);
                void sendTestNotification();
              }
            });
          }}
          last
        />
      </Group>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingHorizontal: SCREEN_GUTTER, paddingBottom: 48, gap: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50, paddingHorizontal: 16 },
  seg: { flexDirection: 'row', padding: 3, borderRadius: radius.pill, gap: 2 },
  segItem: { paddingHorizontal: 12, height: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
