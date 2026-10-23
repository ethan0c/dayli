import { relativeDay, toMinutes } from '@dayli/core';
import { useLingui } from '@lingui/react/macro';
import { router, usePathname, type Href } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { Icon, type IconKey } from '@/components/Icon';
import { Toast } from '@/components/Overlay';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { frameStyle, useWebLayout } from '@/lib/layout';
import { enter, exit } from '@/lib/motion';
import { useNow } from '@/lib/now';
import { SHORTCUTS, useWebShortcuts } from '@/lib/shortcuts';
import { useStore } from '@/store';
import { radius, useTheme } from '@/theme';

/**
 * The tabs on a wide web window. The sidebar lives in the root layout (`Sidebar`), so it stays
 * beside every screen, pushed ones included; this is just the screens, each filling the app's frame
 * with its main column and its pane.
 */
export function DesktopTabs({ dropping }: { dropping: boolean }) {
  const { t } = useLingui();
  const { c } = useTheme();
  const { twoPane } = useWebLayout();
  // Every tab uses the pane: Today's hours or item, Plan's item, School's course, You's settings, Add's recent imports.
  const renderScreen = keepLaidOut(() => frameStyle(twoPane, true));
  return (
    <Tabs style={[styles.root, { backgroundColor: c.canvas }]}>
      <TabSlot style={styles.slot} renderFn={renderScreen} />
      <Toast offset={24} />
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

/**
 * Renders the tab screens for TabSlot without expo-router's `display: none` on the hidden ones: a
 * screen coming back from that is laid out from nothing, and every row's layout animation played on
 * each tab switch. Visited screens stay laid out, invisible and untouchable until chosen again.
 * `frameFor` places each screen in the app's frame on a wide window.
 */
export function keepLaidOut(frameFor?: (routeName: string) => ViewStyle): NonNullable<ComponentProps<typeof TabSlot>['renderFn']> {
  return function renderTabScreen(descriptor, { isFocused, loaded }) {
    if (!loaded && !isFocused) return null;
    const frame = frameFor?.(descriptor.route.name);
    return (
      <View pointerEvents={isFocused ? 'auto' : 'none'} aria-hidden={!isFocused}
        style={[styles.screen, { opacity: isFocused ? 1 : 0, zIndex: isFocused ? 1 : 0 }]}>
        {frame ? <View style={[styles.frame, frame]}>{descriptor.render()}</View> : descriptor.render()}
      </View>
    );
  };
}

type Destination = { href: Href; path: string; icon: IconKey; label: string; hint: string; also?: RegExp };

/**
 * The web's navigation beside every screen once the window is wide: Add, the four tabs with their
 * number keys, and, from 1200, labels, the sync line and the shortcut list. A detail screen marks
 * the tab it belongs to (a course is School's, a setting is You's).
 */
export function Sidebar() {
  const { t } = useLingui();
  const { c } = useTheme();
  const { twoPane } = useWebLayout();
  const pathname = usePathname();
  const [help, setHelp] = useState(false);
  const tabs: Destination[] = [
    { href: '/', path: '/', icon: 'home', label: t`Today`, hint: '1' },
    { href: '/plan', path: '/plan', icon: 'calendar', label: t`Plan`, hint: '2', also: /^\/(employer|import)\// },
    { href: '/school', path: '/school', icon: 'school', label: t`School`, hint: '3', also: /^\/course\// },
    { href: '/you', path: '/you', icon: 'user', label: t`You`, hint: '4', also: /^\/(settings|account)/ },
  ];
  const go = (href: Href) => router.navigate(href);

  useWebShortcuts({
    n: () => router.push({ pathname: '/create', params: { kind: 'task' } }),
    '1': () => go('/'),
    '2': () => go('/plan'),
    '3': () => go('/school'),
    '4': () => go('/you'),
    '?': () => setHelp((open) => !open),
    Escape: () => setHelp(false),
  });

  return (
    <>
      <View style={[styles.side, { width: twoPane ? 212 : 72, borderRightColor: c.line }]}>
        <SideButton labels={twoPane} label={t`Add`} onPress={() => { feedback('tap'); go('/add'); }} />
        {tabs.map((tab) => {
          const selected = pathname === tab.path || !!tab.also?.test(pathname);
          return <SideItem key={tab.path} icon={tab.icon} label={tab.label} hint={tab.hint} labels={twoPane} selected={selected}
            onPress={() => { if (!selected) feedback('select'); go(tab.href); }} />;
        })}
        <View style={{ flex: 1 }} />
        {twoPane ? <SyncLine /> : null}
        {twoPane ? (
          <Pressable accessibilityRole="button" onPress={() => setHelp(true)} style={styles.footLink}>
            <T token="caption" color={c.inkSecondary}>Keyboard shortcuts  ?</T>
          </Pressable>
        ) : null}
      </View>
      {help ? <ShortcutList onClose={() => setHelp(false)} /> : null}
    </>
  );
}

/** react-native-web adds `hovered` to Pressable's state; React Native's types don't list it. */
const hovered = (state: object) => (state as { hovered?: boolean }).hovered === true;

function SideItem({ icon, label, hint, labels, selected, onPress }: { icon: IconKey; label: string; hint: string; labels: boolean; selected: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={label} onPress={onPress}
      style={(state) => [styles.item, !labels && styles.itemIcon,
        { backgroundColor: selected ? c.selectionFill : hovered(state) ? c.row : 'transparent' }]}>
      <Icon name={icon} size={20} color={selected ? c.selectionInk : c.inkSecondary} />
      {labels ? <>
        <T token="body" color={selected ? c.selectionInk : c.inkPrimary} style={{ flex: 1, fontSize: 15 }}>{label}</T>
        <T token="caption" color={selected ? c.selectionInk : c.inkSecondary} tabular style={[styles.kbd, { borderColor: selected ? c.selectionInk : c.line }]}>{hint}</T>
      </> : null}
    </Pressable>
  );
}

function SideButton({ label, labels, onPress }: { label: string; labels: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
      style={(state) => [styles.add, !labels && styles.itemIcon, { backgroundColor: c.controlFill, opacity: hovered(state) ? 0.88 : 1 }]}>
      <Icon name="plus" size={20} color={c.controlInk} />
      {labels ? <T token="headline" color={c.controlInk}>{label}</T> : null}
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
    <Pressable accessibilityRole="button" onPress={() => router.navigate({ pathname: '/you', params: { open: 'data' } })} style={styles.footLink}>
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
  root: { flex: 1 },
  side: { borderRightWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 20, gap: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 40, paddingHorizontal: 12, borderRadius: radius.pill },
  itemIcon: { justifyContent: 'center', paddingHorizontal: 0, gap: 0 },
  add: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 40, borderRadius: radius.pill, marginBottom: 14 },
  kbd: { fontSize: 11, lineHeight: 16, borderWidth: 1, borderRadius: 5, paddingHorizontal: 5 },
  footLink: { paddingHorizontal: 12, paddingVertical: 6 },
  frame: { flex: 1 },
  screen: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  // expo-router's slot never shrinks; held to the window, its screens scroll (see PlannerTabs).
  slot: { flex: 1, minHeight: 0 },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)', zIndex: 10 },
  sheet: { width: 420, maxWidth: '90%', borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 24, gap: 4 },
  shortcut: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  drop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, margin: 16, borderWidth: 2, borderStyle: 'dashed', borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.96 },
});
