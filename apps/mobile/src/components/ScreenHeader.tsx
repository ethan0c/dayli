import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountButton } from '@/components/PlannerChrome';
import { T } from '@/components/Text';
import { Wordmark } from '@/components/Wordmark';
import { SCREEN_GUTTER, useTheme } from '@/theme';

/** One header rhythm across the tabs. safeTop owns the inset when automatic native insets are disabled. */
export function ScreenHeader({ title, subtitle, eyebrow, safeTop = false }: { title: string; subtitle?: string; eyebrow?: string; safeTop?: boolean }) {
  const { c } = useTheme();
  return (
    <View>
      <BrandHeader safeTop={safeTop} />
      <View style={[styles.container, styles.title]}>
        {eyebrow ? <T token="caption" color={c.inkSecondary}>{eyebrow}</T> : null}
        <T token="display" accessibilityRole="header">{title}</T>
        {subtitle ? <T token="callout" color={c.inkSecondary}>{subtitle}</T> : null}
      </View>
    </View>
  );
}

export function BrandHeader({ safeTop = false }: { safeTop?: boolean }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return <View style={[styles.container, { paddingTop: safeTop || Platform.OS !== 'ios' ? insets.top + 8 : 8 }]}>
    <View style={styles.row}>
      <Wordmark width={84} ink={c.inkPrimary} dot={c.accent} />
      <AccountButton />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: SCREEN_GUTTER, paddingBottom: 8 },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { paddingTop: 24, gap: 6 },
});
