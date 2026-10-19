import { router } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { NavButton } from '@/components/NavPill';
import { T } from '@/components/Text';
import { useStore } from '@/store';
import { radius, useTheme } from '@/theme';

export default function TabsLayout() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12) + 6;

  return (
    <Tabs>
      <TabSlot />

      <Toast bottom={bottom + 64} />

      <View style={[styles.bar, { bottom }]} pointerEvents="box-none">
        <View style={[styles.pill, { backgroundColor: c.nav }]}>
          <TabTrigger name="index" asChild>
            <NavButton icon="home" label="Today" />
          </TabTrigger>
          <TabTrigger name="plan" asChild>
            <NavButton icon="check" label="Plan" />
          </TabTrigger>
          <TabTrigger name="school" asChild>
            <NavButton icon="school" label="School" />
          </TabTrigger>
        </View>
        <Pressable
          onPress={() => router.push('/capture')}
          accessibilityLabel="Add"
          style={({ pressed }) => [styles.fab, { backgroundColor: c.nav, opacity: pressed ? 0.85 : 1 }]}>
          <Icon name="plus" size={22} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
      </View>

      <TabList style={{ display: 'none' }}>
        <TabTrigger name="index" href="/">
          <Text>Today</Text>
        </TabTrigger>
        <TabTrigger name="plan" href="/plan">
          <Text>Plan</Text>
        </TabTrigger>
        <TabTrigger name="school" href="/school">
          <Text>School</Text>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

function Toast({ bottom }: { bottom: number }) {
  const { c } = useTheme();
  const toast = useStore((s) => s.toast);
  const hide = useStore((s) => s.hideToast);
  const undo = useStore((s) => s.undoBatch);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(hide, 6000);
    return () => clearTimeout(id);
  }, [toast, hide]);
  if (!toast) return null;
  return (
    <View style={[styles.toast, { bottom, backgroundColor: c.nav }]}>
      <T token="subhead" color="#FFFFFF" style={{ flex: 1 }} numberOfLines={2}>
        {toast.message}
      </T>
      {toast.batchId ? (
        <Pressable onPress={() => undo(toast.batchId!)} hitSlop={8} style={styles.undo}>
          <Icon name="undo" size={14} color="#FFFFFF" />
          <T token="subhead" color="#FFFFFF">
            Undo
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}

const shadow = { shadowColor: '#18171C', shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8 };

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: { flexDirection: 'row', padding: 4, borderRadius: radius.pill, ...shadow },
  fab: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', ...shadow },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    ...shadow,
  },
  undo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
