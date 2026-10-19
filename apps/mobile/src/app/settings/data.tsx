import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Group, Row } from '@/components/Settings';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { useStore } from '@/store';
import { SCREEN_GUTTER, radius, useTheme } from '@/theme';

export default function DataScreen() {
  const { c } = useTheme();
  const batches = useStore((s) => s.batches);
  const undoBatch = useStore((s) => s.undoBatch);
  const loadSample = useStore((s) => s.loadSample);
  const clearAll = useStore((s) => s.clearAll);
  const setSettings = useStore((s) => s.setSettings);
  const [confirm, setConfirm] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.body} contentInsetAdjustmentBehavior="automatic">
      <Group title="Recent changes" footer={batches.length ? 'Undo puts things back exactly as they were.' : undefined}>
        {batches.length === 0 ? (
          <View style={styles.empty}>
            <T token="callout" color={c.inkSecondary}>
              Your imports and edits will appear here. You can undo them anytime.
            </T>
          </View>
        ) : (
          batches.slice(0, 20).map((b, i) => (
            <View key={b.id} style={[styles.batch, i < Math.min(batches.length, 20) - 1 ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line } : null, { opacity: b.undone ? 0.5 : 1 }]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T numberOfLines={1} style={b.undone ? { textDecorationLine: 'line-through' } : null}>
                  {b.label}
                </T>
                <T token="caption" color={c.inkSecondary}>
                  {new Date(b.createdAt).toLocaleString()} · {b.changes.length} {b.changes.length === 1 ? 'change' : 'changes'}
                </T>
              </View>
              {!b.undone && b.changes.length > 0 ? (
                <Pressable onPress={() => { feedback('undo'); undoBatch(b.id); }} hitSlop={8} style={styles.undo}>
                  <Icon name="undo" size={14} color={c.accent} />
                  <T token="subhead" color={c.accent}>
                    Undo
                  </T>
                </Pressable>
              ) : null}
            </View>
          ))
        )}
      </Group>

      <Group title="Try things" footer="The sample week is marked so you can clear it later without touching your own plans.">
        <Row icon="sparkle" tint={c.tint.butter.fill} label="Load the sample week" onPress={() => { feedback('success'); loadSample(); }} />
        <Row icon="undo" tint={c.tint.sky.fill} label="Replay the intro" onPress={() => { feedback('tap'); setSettings({ onboarded: false, onboardingImportDone: false }); router.dismissAll(); }} last />
      </Group>

      <Group title="Danger zone" footer="Everything is stored on this phone. Clearing removes your events, to-dos, courses, schedules, and history. This cannot be undone.">
        {confirm ? (
          <View style={[styles.confirm, { backgroundColor: c.conflictBg }]}>
            <T color={c.conflict} style={{ flex: 1 }}>
              Clear everything?
            </T>
            <Pressable onPress={() => setConfirm(false)} style={[styles.btn, { borderColor: c.conflict }]}>
              <T token="subhead" color={c.conflict}>
                Keep
              </T>
            </Pressable>
            <Pressable
              onPress={() => {
                clearAll();
                setConfirm(false);
                feedback('warning');
              }}
              style={[styles.btn, { backgroundColor: c.conflict, borderColor: c.conflict }]}>
              <T token="subhead" color="#FFFFFF">
                Clear
              </T>
            </Pressable>
          </View>
        ) : (
          <Row icon="trash" tint={c.conflictBg} label="Clear everything" destructive onPress={() => { feedback('tap'); setConfirm(true); }} last />
        )}
      </Group>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingHorizontal: SCREEN_GUTTER, paddingBottom: 48, gap: 22 },
  empty: { padding: 16 },
  batch: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  undo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  confirm: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  btn: { paddingHorizontal: 12, height: 34, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
