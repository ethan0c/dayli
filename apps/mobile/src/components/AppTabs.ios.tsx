import { NativeTabs } from 'expo-router/native-tabs';
import { DynamicColorIOS, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Toast } from '@/components/Overlay';
import { AddMenu } from '@/components/AddMenu';
import { useTheme } from '@/theme';

/** iOS: the system tab bar (Liquid Glass on iOS 26) with a matching glass "+" floating above it. */
export default function AppTabs() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const tint = DynamicColorIOS({ light: c.inkPrimary, dark: '#F4F3F8' });
  return (
    <View style={{ flex: 1 }}>
      <NativeTabs tintColor={tint} minimizeBehavior="onScrollDown">
        <NativeTabs.Trigger name="index" disableAutomaticContentInsets>
          <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="plan">
          <NativeTabs.Trigger.Label>Plan</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'checkmark.square', selected: 'checkmark.square.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="school" disableAutomaticContentInsets>
          <NativeTabs.Trigger.Label>School</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'graduationcap', selected: 'graduationcap.fill' }} />
        </NativeTabs.Trigger>
      </NativeTabs>
      <Toast offset={76} />
      <AddMenu bottom={insets.bottom + 68} />
    </View>
  );
}

