import { NativeTabs } from 'expo-router/native-tabs';
import { DynamicColorIOS, View } from 'react-native';

import { CaptureFab, Toast } from '@/components/Overlay';
import { useTheme } from '@/theme';

/** iOS: the system tab bar (Liquid Glass on iOS 26), with Dayli's capture button floating above it. */
export default function AppTabs() {
  const { c } = useTheme();
  const tint = DynamicColorIOS({ light: c.inkPrimary, dark: '#F4F3F8' });
  return (
    <View style={{ flex: 1 }}>
      <NativeTabs tintColor={tint} minimizeBehavior="onScrollDown">
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="plan">
          <NativeTabs.Trigger.Label>Plan</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'checkmark.square', selected: 'checkmark.square.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="school">
          <NativeTabs.Trigger.Label>School</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'graduationcap', selected: 'graduationcap.fill' }} />
        </NativeTabs.Trigger>
      </NativeTabs>
      <Toast offset={76} />
      <CaptureFab offset={76} />
    </View>
  );
}
