import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { GlassCircle } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { useTheme } from '@/theme';

/** The X on the left of a full-screen cover's native header. */
export function CloseButton({ onPress }: { onPress?: () => void }) {
  const { c } = useTheme();
  return (
    <Press accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} scale={0.9} onPress={onPress ?? (() => router.back())} style={styles.button}>
      <GlassCircle size={36} plain><Icon name="x" size={22} color={c.inkPrimary} /></GlassCircle>
    </Press>
  );
}

/** A back chevron for the root screen of a nested stack, where iOS cannot draw its own. */
export function BackButton({ onPress }: { onPress?: () => void }) {
  const { c } = useTheme();
  return (
    <Press accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} scale={0.9} onPress={onPress ?? (() => router.back())} style={styles.button}>
      <GlassCircle size={36} plain><Icon name="chevronLeft" size={22} color={c.inkPrimary} /></GlassCircle>
    </Press>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
});
