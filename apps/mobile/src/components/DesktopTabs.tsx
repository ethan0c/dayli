import { relativeDay, toMinutes } from '@dayli/core';
import { useLingui } from '@lingui/react/macro';
import { router, usePathname } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Icon, type IconKey } from '@/components/Icon';
import { Toast } from '@/components/Overlay';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { COLUMN, WIDE_COLUMN, useWebLayout } from '@/lib/layout';
import { enter, exit } from '@/lib/motion';
import { useNow } from '@/lib/now';
import { SHORTCUTS, useWebShortcuts } from '@/lib/shortcuts';
import { useStore } from '@/store';
import { radius, useTheme } from '@/theme';

/**
 * The web planner on a wide window: a sidebar in place of the tab pill, the screen in a centred
 * column beside it. Labels show from 1200 wide; below that the sidebar is icons only. Today and
 * Plan get the wider column there, for their second pane.
 */
export function DesktopTabs({ dropping }: { dropping: boolean }) {
  const { t } = useLingui();
  const { c } = useTheme();
  const { twoPane } = useWebLayout();
  const pathname = usePathname();
  const [help, setHelp] = useState(false);
  const wideRoute = twoPane && (pathname === '/' || pathname === '/plan');

  useWebShortcuts({
    n: () => router.push({ pathname: '/create', params: { kind: 'task' } }),
    '1': () => router.navigate('/'),
    '2': () => router.navigate('/plan'),
    '3': () => router.navigate('/school'),
    '4': () => router.navigate('/you'),
    '?': () => setHelp((open) => !open),
    Escape: () => setHelp(false),
  });

  return (
    <Tabs style={[styles.root, { backgroundColor: c.canvas }]}>
      <View style={[styles.side, { width: twoPane ? 212 : 72, borderRightColor: c.line }]}>
        <TabTrigger name="add" asChild><SideAdd labels={twoPane} /></TabTrigger>
        <TabTrigger name="index" asChild><SideItem icon="home" label={t`Today`} hint="1" labels={twoPane} /></TabTrigger>
        <TabTrigger name="plan" asChild><SideItem icon="calendar" label={t`Plan`} hint="2" labels={twoPane} /></TabTrigger>
        <TabTrigger name="school" asChild><SideItem icon="school" label={t`School`} hint="3" labels={twoPane} /></TabTrigger>
        <TabTrigger name="you" asChild><SideItem icon="user" label={t`You`} hint="4" labels={twoPane} /></TabTrigger>
        <View style={{ flex: 1 }} />
        {twoPane ? <SyncLine /> : null}
        {twoPane ? (
          <Pressable accessibilityRole="button" onPress={() => setHelp(true)} style={styles.helpLink}>
            <T token="caption" color={c.inkSecondary}>Keyboard shortcuts  ?</T>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.main}>
        <View style={[styles.column, { maxWidth: wideRoute ? WIDE_COLUMN : COLUMN }]}>
          <TabSlot style={styles.slot} />
        </View>
      </View>
      <Toast offset={24} />
      {help ? <ShortcutList onClose={() => setHelp(false)} /> : null}
      {dropping ? <DropHint /> : null}
      <TabList style={{ display: 'none' }}>
        <TabTrigger name="index" href="/"><Text>{t`Today`}</Text></TabTrigger>
        <TabTrigger name="plan" href="/plan"><Text>{t`Plan`}</Text></TabTrigger>
        <TabTrigger name="school" href="/school"><Text>{t`School`}</Text></TabTrigger>
        <TabTrigger name="you" href="/you"><Text>{t`You`}</Text></TabTrigger>
        <TabTrigger name="add" href="/add"><Text>{t`Add`}</Text></TabTrigger>
      </TabList>
    </Tabs>
  );
}

type SlotProps = Omit<TabTriggerSlotProps, 'ref'> & { labels: boolean };

/** react-native-web adds `hovered` to Pressable's state; React Native's types don't list it. */
const hovered = (state: object) => (state as { hovered?: boolean }).hovered === true;

function SideItem({ icon, label, hint, labels, isFocused, onPress, ...props }: SlotProps & { icon: IconKey; label: string; hint: string }) {
  const { c } = useTheme();
  return (
    <Pressable {...props} accessibilityRole="tab" accessibilityState={{ selected: !!isFocused }} accessibilityLabel={label}
      onPress={(e) => { if (!isFocused) feedback('select'); onPress?.(e); }}
      style={(state) => [styles.item, !labels && styles.itemIcon,
        { backgroundColor: isFocused ? c.selectionFill : hovered(state) ? c.row : 'transparent' }]}>
      <Icon name={icon} size={20} color={isFocused ? c.selectionInk : c.inkSecondary} />
      {labels ? <>
        <T token="body" color={isFocused ? c.selectionInk : c.inkPrimary} style={{ flex: 1, fontSize: 15 }}>{label}</T>
        <T token="caption" color={isFocused ? c.selectionInk : c.inkSecondary} tabular style={[styles.kbd, { borderColor: isFocused ? c.selectionInk : c.line }]}>{hint}</T>
      </> : null}
    </Pressable>
  );
}

function SideAdd({ labels, isFocused, onPress, ...props }: SlotProps) {
  const { c } = useTheme();
  return (
    <Pressable {...props} accessibilityRole="tab" accessibilityState={{ selected: !!isFocused }} accessibilityLabel="Add"
      onPress={(e) => { feedback('tap'); onPress?.(e); }}
      style={(state) => [styles.add, !labels && styles.itemIcon, { backgroundColor: c.controlFill, opacity: hovered(state) ? 0.88 : 1 }]}>
      <Icon name="plus" size={20} color={c.controlInk} />
      {labels ? <T token="headline" color={c.controlInk}>Add</T> : null}
    </Pressable>
  );
}

/** When the plan last reached the account, so a laptop never looks current when it isn't. */
function SyncLine() {
  const { c } = useTheme();
  const now = useNow();
  const cloud = useStore((s) => s.settings.cloud);
  let line = 'Saved in this browser';
  if (cloud.error) line = 'Sync needs attention';
  else if (cloud.backedUpAt) {
    const at = new Date(cloud.backedUpAt);
    const date = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;
    const minutes = date === now.date ? toMinutes(now.time) - (at.getHours() * 60 + at.getMinutes()) : null;
    line = minutes === null ? `Synced ${relativeDay(now.date, date).toLowerCase()}` : minutes < 1 ? 'Synced just now' : minutes < 60 ? `Synced ${minutes} min ago` : `Synced at ${at.getHours() % 12 || 12}:${String(at.getMinutes()).padStart(2, '0')} ${at.getHours() < 12 ? 'am' : 'pm'}`;
  }
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/settings/data')} style={styles.sync}>
      <T token="caption" color={cloud.error ? c.changed : c.inkSecondary}>{line}</T>
    </Pressable>
  );
}

function ShortcutList({ onClose }: { onClose: () => void }) {
  const { c } = useTheme();
  return (
    <Animated.View entering={enter.fade} exiting={exit.fade} style={styles.scrim}>
      <Pressable accessibilityLabel="Close shortcuts" onPress={onClose} style={StyleSheet.absoluteFill} />
      <View accessibilityRole="summary" style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.line }]}>
        <T token="title">Keyboard shortcuts</T>
        {SHORTCUTS.map((s) => (
          <View key={s.keys} style={[styles.shortcut, { borderBottomColor: c.line }]}>
            <T token="body" style={{ flex: 1 }}>{s.does}</T>
            <T token="callout" color={c.inkSecondary} tabular>{s.keys}</T>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

/** While a file is dragged over the window: let go anywhere to import it. */
export function DropHint() {
  const { c } = useTheme();
  return (
    <Animated.View pointerEvents="none" entering={enter.fade} exiting={exit.fade} style={[styles.drop, { borderColor: c.inkSecondary, backgroundColor: c.canvas }]}>
      <Icon name="file" size={28} color={c.inkPrimary} />
      <T token="title">Drop to import</T>
      <T token="callout" color={c.inkSecondary}>A screenshot, a photo, or a PDF like a syllabus</T>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  side: { borderRightWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 20, gap: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 40, paddingHorizontal: 12, borderRadius: radius.pill },
  itemIcon: { justifyContent: 'center', paddingHorizontal: 0, gap: 0 },
  add: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 40, borderRadius: radius.pill, marginBottom: 14 },
  kbd: { fontSize: 11, lineHeight: 16, borderWidth: 1, borderRadius: 5, paddingHorizontal: 5 },
  sync: { paddingHorizontal: 12, paddingVertical: 6 },
  helpLink: { paddingHorizontal: 12, paddingVertical: 6 },
  main: { flex: 1 },
  column: { flex: 1, width: '100%', alignSelf: 'center' },
  // expo-router's slot never shrinks; held to the window, its screens scroll (see PlannerTabs).
  slot: { flex: 1, minHeight: 0 },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  sheet: { width: 420, maxWidth: '90%', borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 24, gap: 4 },
  shortcut: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  drop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, margin: 16, borderWidth: 2, borderStyle: 'dashed', borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.96 },
});
