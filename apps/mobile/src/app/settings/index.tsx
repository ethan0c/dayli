import { Stack, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { FieldRow, Group, Row, ToggleRow } from '@/components/Settings';
import { T } from '@/components/Text';
import { Wordmark } from '@/components/Wordmark';
import { feedback } from '@/lib/feedback';
import { FREE_IMPORTS_PER_MONTH } from '@/lib/plans';
import { useStore } from '@/store';
import { useTheme } from '@/theme';

const APPEARANCE_LABEL = { system: 'System', light: 'Light', dark: 'Dark' } as const;

export default function SettingsHome() {
  const { c } = useTheme();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const usage = useStore((s) => s.usage);
  const month = new Date().toISOString().slice(0, 7);
  const used = usage.month === month ? usage.imports : 0;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.dismiss()} hitSlop={10} accessibilityLabel="Done">
              <T token="headline" color={c.accent}>
                Done
              </T>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic">
        <Group footer="Nowli uses your name in the morning greeting and nowhere else.">
          <FieldRow label="Name" value={settings.name} onChange={(name) => setSettings({ name })} placeholder="Your first name" last />
        </Group>

        <Group title="Preferences" footer="Sounds follow your ring/silent switch.">
          <Row icon="sparkle" tint={c.tint.lavender.fill} label="Appearance" value={APPEARANCE_LABEL[settings.appearance]} onPress={() => router.push('/settings/appearance')} />
          <ToggleRow
            icon="volume"
            tint={c.tint.mint.fill}
            label="Sounds"
            value={settings.sounds}
            onChange={(sounds) => {
              setSettings({ sounds });
              feedback('select');
            }}
          />
          <ToggleRow
            icon="vibrate"
            tint={c.tint.sky.fill}
            label="Haptics"
            value={settings.haptics}
            onChange={(haptics) => {
              setSettings({ haptics });
              feedback('tap');
            }}
          />
          <Row
            icon="heart"
            tint={c.tint.rose.fill}
            label="Your plan"
            value={`Free · ${used} of ${FREE_IMPORTS_PER_MONTH} imports`}
            onPress={() => router.push('/settings/plan')}
            last
          />
        </Group>

        <Group title="Your stuff">
          <Row icon="file" tint={c.tint.sky.fill} label="Your data" value="On this phone" onPress={() => router.push('/settings/data')} />
          <Row icon="clock" tint={c.tint.butter.fill} label="Nowli server" value={settings.apiUrl.replace(/^https?:\/\//, '')} onPress={() => router.push('/settings/server')} last />
        </Group>

        <View style={styles.about}>
          <Wordmark width={88} ink={c.inkPrimary} />
          <T token="caption" color={c.inkSecondary}>
            Nowli 0.1 · The daily planner for college students.
          </T>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 48, gap: 22 },
  about: { alignItems: 'center', gap: 8, paddingTop: 16 },
});
