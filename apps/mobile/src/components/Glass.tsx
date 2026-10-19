import { GlassContainer, GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

/** True on iOS 26 and later built with the iOS 26 SDK: chrome buttons sit in Liquid Glass there. */
export const GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable();

/**
 * A round glass surface for one chrome button (the Today toggle, close, back). Elsewhere
 * it is the grey circle from the Buttons board, so the geometry never changes.
 */
export function GlassCircle({ size = 44, children, style, plain = false }: { size?: number; children: ReactNode; style?: StyleProp<ViewStyle>; plain?: boolean }) {
  const { c } = useTheme();
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (GLASS) {
    return (
      <GlassView isInteractive style={[styles.center, shape, style]}>
        {children}
      </GlassView>
    );
  }
  return <View style={[styles.center, shape, !plain ? { backgroundColor: c.row } : null, style]}>{children}</View>;
}

/**
 * Groups several chrome buttons so their glass merges into one capsule when they sit
 * together at the top of a screen. Children keep their own GlassCircle.
 */
export function GlassGroup({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  if (GLASS) {
    return <GlassContainer spacing={8} style={[styles.group, style]}>{children}</GlassContainer>;
  }
  return <View style={[styles.group, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  group: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
