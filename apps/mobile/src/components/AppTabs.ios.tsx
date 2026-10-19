import { Button as SwiftButton, Host } from '@expo/ui/swift-ui';
import { buttonBorderShape, buttonStyle, controlSize, foregroundColor, labelStyle, tint as tintMod } from '@expo/ui/swift-ui/modifiers';
import { NativeTabs } from 'expo-router/native-tabs';
import { DynamicColorIOS, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddMenu, useAddMenu } from '@/components/AddMenu';
import { Toast } from '@/components/Overlay';
import { palettes } from '@dayli/tokens';
import { useTheme } from '@/theme';

const GLASS = Number(Platform.Version) >= 26;

/**
 * iOS: the system tab bar (Liquid Glass on iOS 26) with the "+" as a glass button in the
 * tab bar's bottom accessory, so it minimizes and floats with the bar. Older iOS gets the
 * same button floating above the bar.
 */
export default function AppTabs() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <AddMenu bottom={insets.bottom + 4} nativeTrigger>
        <TabBar />
      </AddMenu>
      <Toast offset={GLASS ? 120 : 76} />
    </View>
  );
}

function TabBar() {
  const insets = useSafeAreaInsets();
  const tint = DynamicColorIOS({ light: palettes.light.inkPrimary, dark: palettes.dark.inkPrimary });
  return (
    <>
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
        {GLASS ? (
          <NativeTabs.BottomAccessory>
            <Accessory />
          </NativeTabs.BottomAccessory>
        ) : null}
      </NativeTabs>
      {!GLASS ? (
        <Host style={[styles.fab, { bottom: insets.bottom + 68 }]} matchContents>
          <AddGlassButton />
        </Host>
      ) : null}
    </>
  );
}

/** Rendered twice by the system (regular and inline); it holds no state of its own. */
function Accessory() {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  return (
    <View style={[styles.accessory, placement === 'inline' ? styles.accessoryInline : null]}>
      <Host matchContents>
        <AddGlassButton />
      </Host>
    </View>
  );
}

function AddGlassButton() {
  const { c } = useTheme();
  const { open, expanded } = useAddMenu();
  return (
    <SwiftButton
      label={expanded ? 'Close' : 'Add'}
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
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', right: 16 },
  accessory: { flex: 1, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 8 },
  accessoryInline: { paddingRight: 4 },
});
