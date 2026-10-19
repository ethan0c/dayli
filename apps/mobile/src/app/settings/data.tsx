import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { TextButton } from '@/components/Controls';
import { Group, Row } from '@/components/Settings';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { enter, exit, layout } from '@/lib/motion';
import { useStore } from '@/store';
import { SCREEN_GUTTER, useTheme } from '@/theme';

export default function DataScreen() {
  const { c } = useTheme();
  const batches = useStore((s) => s.batches);
  const undoBatch = useStore((s) => s.undoBatch);
  const clearAll = useStore((s) => s.clearAll);
  const setSettings = useStore((s) => s.setSettings);
  const [confirm, setConfirm] = useState(false);
  const recent = batches.slice(0, 20);

  return (
    <ScrollView contentContainerStyle={styles.body} contentInsetAdjustmentBehavior="automatic">
      <Group title="Recent changes" footer={batches.length ? 'Undo puts things back exactly as they were.' : undefined}>
        {recent.length === 0 ? (
          <View style={styles.empty}>
            <T token="callout" color={c.inkSecondary}>
              Your imports and edits will appear here. You can undo them anytime.
            </T>
          </View>
        ) : (
          recent.map((b, i) => (
            <Animated.View key={b.id} layout={layout} entering={enter.fade} exiting={exit.fade}
              style={[styles.batch, i < recent.length - 1 ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line } : null, { opacity: b.undone ? 0.5 : 1 }]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T numberOfLines={1} style={b.undone ? { textDecorationLine: 'line-through' } : null}>
                  {b.label}
                </T>
                <T token="caption" color={c.inkSecondary}>
                  {new Date(b.createdAt).toLocaleString()} · {b.changes.length} {b.changes.length === 1 ? 'change' : 'changes'}
                </T>
              </View>
              {!b.undone && b.changes.length > 0 ? (
                <TextButton label="Undo" haptic="undo" onPress={() => undoBatch(b.id)} />
              ) : null}
            </Animated.View>
          ))
        )}
      </Group>

      <Group title="Get started again" footer="Replay the intro without changing your existing plans.">
        <Row label="Replay the intro" onPress={() => { feedback('tap'); setSettings({ onboarded: false, onboardingImportDone: false }); router.dismissTo('/'); }} last />
      </Group>

      <Group title="Danger zone" footer="Everything is stored on this phone. Clearing removes your events, to-dos, courses, schedules, and history. This cannot be undone.">
        {confirm ? (
          <Animated.View entering={enter.drop} style={styles.confirm} accessibilityRole="alert">
            <T token="callout" style={{ flex: 1 }}>Clear everything? This cannot be undone.</T>
            <TextButton label="Keep" tone="muted" onPress={() => setConfirm(false)} />
            <TextButton label="Clear" tone="danger" haptic="warning" onPress={() => { clearAll(); setConfirm(false); }} />
          </Animated.View>
        ) : (
          <Row label="Clear everything" destructive onPress={() => { feedback('tap'); setConfirm(true); }} last />
        )}
      </Group>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingHorizontal: SCREEN_GUTTER, paddingBottom: 48, gap: 22 },
  empty: { paddingVertical: 16 },
  batch: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 8 },
  confirm: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 8 },
});
