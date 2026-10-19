import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T } from '@/components/Text';
import { SCREEN_GUTTER, useTheme } from '@/theme';

/**
 * The top of a tab screen: no wordmark, no account button. A quiet eyebrow, a light title,
 * and an optional line under it. `safeTop` owns the inset when automatic native insets are off.
 */
export function ScreenHeader({ title, subtitle, eyebrow, safeTop = false }: { title: string; subtitle?: string; eyebrow?: string; safeTop?: boolean }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: (safeTop ? insets.top : 0) + 18 }]}>
      {eyebrow ? <T token="callout" color={c.inkSecondary}>{eyebrow}</T> : null}
      <T token="display" accessibilityRole="header">{title}</T>
      {subtitle ? <T token="callout" color={c.inkSecondary}>{subtitle}</T> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: SCREEN_GUTTER, paddingBottom: 8, gap: 2 },
});
