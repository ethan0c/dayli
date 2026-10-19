import { NativeTabs } from 'expo-router/native-tabs';
import { DynamicColorIOS, Platform, View } from 'react-native';

import { Toast } from '@/components/Overlay';
import { palettes } from '@dayli/tokens';

const GLASS = Number(Platform.Version) >= 26;

/**
 * iOS: the system tab bar (Liquid Glass on iOS 26). Add is the fifth tab with the
 * "search" role, which iOS 26 draws as the detached circle to the right of the main
 * pill; older iOS shows it as a normal trailing tab. The same pattern helthy uses for
 * its fifth tab.
 */
export default function AppTabs() {
  return (
    <View style={{ flex: 1 }}>
      <TabBar />
      <Toast offset={GLASS ? 120 : 76} />
    </View>
  );
}

function TabBar() {
  const tint = DynamicColorIOS({ light: palettes.light.accent, dark: palettes.dark.accent });
  return (
    <NativeTabs tintColor={tint} minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="index" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="plan" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>Plan</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'calendar', selected: 'calendar' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="school" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>School</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'graduationcap', selected: 'graduationcap.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="you" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Label>You</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="add" role="search" disableAutomaticContentInsets disablePopToTop>
        <NativeTabs.Trigger.Label>Add</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'plus', selected: 'plus' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
