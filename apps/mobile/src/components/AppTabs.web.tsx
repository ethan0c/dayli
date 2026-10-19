import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NavButton } from '@/components/NavPill';
import { CaptureFab, Toast } from '@/components/Overlay';
import { radius, useTheme } from '@/theme';

/** Web: the floating nav pill from the design, since there is no system tab bar to use. */
export default function AppTabs() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12) + 6;
  return (
    <Tabs>
      <TabSlot />
      <Toast offset={bottom + 64} />
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
      </View>
      <CaptureFab offset={bottom} />
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

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 16, right: 96, flexDirection: 'row', alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    shadowColor: '#18171C',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
});
