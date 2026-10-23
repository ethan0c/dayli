import { useLingui } from '@lingui/react/macro';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DesktopTabs, DropHint, keepLaidOut } from '@/components/DesktopTabs';
import { NavButton } from '@/components/NavPill';
import { Toast } from '@/components/Overlay';
import { useWebLayout } from '@/lib/layout';
import { useWebFileDrop } from '@/lib/web-drop';
import { SCREEN_GUTTER, useTheme } from '@/theme';

/** Non-iOS: the web's sidebar on a wide window, otherwise the five destinations in a pill. */
export default function PlannerTabs() {
  const { sidebar } = useWebLayout();
  // A file dropped or pasted anywhere opens Add with it (the web only).
  const dropping = useWebFileDrop(true);
  return sidebar ? <DesktopTabs dropping={dropping} /> : <PillTabs dropping={dropping} />;
}

const renderScreen = keepLaidOut();

/** The five destinations in a pill; Add is the last one. */
function PillTabs({ dropping }: { dropping: boolean }) {
  const { t } = useLingui();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12);
  return (
    <Tabs style={{ flex: 1, backgroundColor: c.canvas }}>
      <TabSlot style={styles.slot} renderFn={renderScreen} />
      <View style={[styles.bar, { bottom }]} pointerEvents="box-none">
        <View style={[styles.pill, { backgroundColor: c.surface, borderColor: c.line }]}>
          <TabTrigger name="index" asChild><NavButton icon="home" label={t`Today`} /></TabTrigger>
          <TabTrigger name="plan" asChild><NavButton icon="calendar" label={t`Plan`} /></TabTrigger>
          <TabTrigger name="school" asChild><NavButton icon="school" label={t`School`} /></TabTrigger>
          <TabTrigger name="you" asChild><NavButton icon="user" label={t`You`} /></TabTrigger>
          <TabTrigger name="add" asChild><NavButton icon="plus" label={t`Add`} /></TabTrigger>
        </View>
      </View>
      <Toast offset={bottom - insets.bottom + 12} />
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

const styles = StyleSheet.create({
  // expo-router's slot never shrinks, so on the web a screen grew to its full length and its
  // ScrollView had nothing to scroll; held to the window, the screen scrolls.
  slot: { flex: 1, minHeight: 0 },
  bar: { position: 'absolute', left: SCREEN_GUTTER, right: SCREEN_GUTTER },
  pill: { flexDirection: 'row', padding: 4, borderRadius: 32, borderWidth: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
});
