import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddMenu } from '@/components/AddMenu';
import { NavButton } from '@/components/NavPill';
import { Toast } from '@/components/Overlay';
import { SCREEN_GUTTER, useTheme } from '@/theme';

/** Shared custom chrome keeps the three destinations and detached Add in place. */
export default function PlannerTabs() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12);
  return (
    <Tabs style={{ flex: 1, backgroundColor: c.canvas }}>
      <TabSlot />
      <View style={[styles.bar, { bottom }]} pointerEvents="box-none">
        <View style={[styles.pill, { backgroundColor: c.surface, borderColor: c.line }]}>
          <TabTrigger name="index" asChild><NavButton icon="home" label="Today" /></TabTrigger>
          <TabTrigger name="plan" asChild><NavButton icon="calendar" label="Plan" /></TabTrigger>
          <TabTrigger name="school" asChild><NavButton icon="school" label="School" /></TabTrigger>
          <TabTrigger name="you" asChild><NavButton icon="user" label="You" /></TabTrigger>
        </View>
      </View>
      <AddMenu bottom={bottom} />
      <Toast offset={bottom - insets.bottom + 12} />
      <TabList style={{ display: 'none' }}>
        <TabTrigger name="index" href="/"><Text>Today</Text></TabTrigger>
        <TabTrigger name="plan" href="/plan"><Text>Plan</Text></TabTrigger>
        <TabTrigger name="school" href="/school"><Text>School</Text></TabTrigger>
        <TabTrigger name="you" href="/you"><Text>You</Text></TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: SCREEN_GUTTER, right: SCREEN_GUTTER + 68 },
  pill: { flexDirection: 'row', padding: 4, borderRadius: 32, borderWidth: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
});
