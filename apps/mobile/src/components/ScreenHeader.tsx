import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountButton } from '@/components/PlannerChrome';
import { T } from '@/components/Text';
import { usePurchases } from '@/providers/PurchasesProvider';
import { SCREEN_GUTTER, useTheme } from '@/theme';

/** One header rhythm across the tabs. safeTop owns the inset when automatic native insets are disabled. */
export function ScreenHeader({ title, subtitle, safeTop = false }: { title: string; subtitle?: string; safeTop?: boolean }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { isPro } = usePurchases();
  return (
    <View style={[styles.container, { paddingTop: safeTop || Platform.OS !== 'ios' ? insets.top + 6 : 6 }]}>
      <View style={styles.row}>
        <View style={styles.side}><AccountButton /></View>
        <View style={styles.title}>
          <T token="headline" accessibilityRole="header">{title}</T>
          {subtitle ? <T token="caption" color={c.inkSecondary}>{subtitle}</T> : null}
        </View>
        <View style={[styles.side, { alignItems: 'flex-end' }]}>
          {!isPro ? <Pressable accessibilityRole="button" accessibilityLabel="View Semli Pro plans" onPress={() => router.push('/settings/plan')} style={[styles.pro, { backgroundColor: c.accentSoft }]}>
            <T token="subhead" color={c.accentInk}>Plus</T>
          </Pressable> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: SCREEN_GUTTER, paddingBottom: 8 },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12 },
  side: { width: 48, justifyContent: 'center' },
  title: { flex: 1, alignItems: 'center', gap: 2 },
  pro: { minWidth: 44, minHeight: 36, paddingHorizontal: 12, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
