import { Button as SwiftButton, Host } from '@expo/ui/swift-ui';
import { buttonBorderShape, buttonStyle, controlSize, foregroundColor, labelStyle, tint as tintMod } from '@expo/ui/swift-ui/modifiers';
import { NativeTabs } from 'expo-router/native-tabs';
import { DynamicColorIOS, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Toast } from '@/components/Overlay';
import { AddMenu } from '@/components/AddMenu';
import { useTheme } from '@/theme';

const GLASS = Number(Platform.Version) >= 26;

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
      <AddMenu bottom={insets.bottom + 68} renderTrigger={(open) => <Host style={[styles.fab, { bottom: insets.bottom + 68 }]} matchContents>
        <SwiftButton
          label="Add"
          systemImage="plus"
          onPress={open}
          modifiers={[
            buttonStyle(GLASS ? 'glassProminent' : 'borderedProminent'),
            buttonBorderShape('circle'),
            controlSize('extraLarge'),
            labelStyle('iconOnly'),
            tintMod(c.inkPrimary),
            foregroundColor(c.onPrimary),
          ]}
        />
      </Host>} />
    </View>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', right: 16 },
});
