import { NativeTabs } from 'expo-router/native-tabs';
import { palettes } from '@dayli/tokens';
import { DynamicColorIOS, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Toast } from '@/components/Overlay';
import { AddMenu, useAddMenu } from '@/components/AddMenu';

/** Same native detached-circle slot as Helthy's AI tab; the circle opens Add. */
export default function AppTabs() {
  const insets = useSafeAreaInsets();
  return <View style={{ flex: 1 }}>
    <AddMenu bottom={insets.bottom + 4} nativeTrigger><TabBar /></AddMenu>
    <Toast offset={76} />
  </View>;
}

function TabBar() {
  const { open, expanded } = useAddMenu();
  const tint = DynamicColorIOS({ light: palettes.light.inkPrimary, dark: palettes.dark.inkPrimary });
  return <NativeTabs tintColor={tint} minimizeBehavior="onScrollDown">
    <NativeTabs.Trigger name="index" disableAutomaticContentInsets>
      <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="plan" disableAutomaticContentInsets>
      <NativeTabs.Trigger.Label>Plan</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf={{ default: 'checkmark.square', selected: 'checkmark.square.fill' }} />
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="school" disableAutomaticContentInsets>
      <NativeTabs.Trigger.Label>School</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf={{ default: 'graduationcap', selected: 'graduationcap.fill' }} />
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="add" role="search" disabled accessibilityLabel={expanded ? 'Close add menu' : 'Add to your plan'} listeners={{ tabPress: open }}>
      <NativeTabs.Trigger.Label hidden>Add</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf="plus" />
    </NativeTabs.Trigger>
  </NativeTabs>;
}

