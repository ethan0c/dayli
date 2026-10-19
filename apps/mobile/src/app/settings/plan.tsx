import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PlanPicker } from '@/components/PlanPicker';
import { T } from '@/components/Text';
import { FREE_IMPORTS_PER_MONTH } from '@/lib/plans';
import { PRO_ENTITLEMENT } from '@/lib/revenuecat';
import { usePurchases } from '@/providers/PurchasesProvider';
import { useStore } from '@/store';
import { SCREEN_GUTTER, radius, useTheme } from '@/theme';

export default function PlanScreen() {
  const { c } = useTheme();
  const { customerInfo, isPro } = usePurchases();
  const usage = useStore((s) => s.usage);
  const month = new Date().toISOString().slice(0, 7);
  const used = usage.month === month ? usage.imports : 0;
  const left = Math.max(0, FREE_IMPORTS_PER_MONTH - used);
  const entitlement = customerInfo?.entitlements.active[PRO_ENTITLEMENT];

  if (!isPro) return <>
    <Stack.Screen options={{ headerShown: false }} />
    <PlanPicker hero docked freeImportsLeft={left} />
  </>;

  return (
    <ScrollView contentContainerStyle={styles.body} contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ headerShown: true }} />
      <View style={[styles.status, { backgroundColor: c.tint.mint.fill }]}>
        <T token="overline" color={c.tint.mint.ink}>
          Semli Plus
        </T>
        <T token="display" color={c.tint.mint.ink}>
          Unlimited imports
        </T>
        <T token="callout" color={c.tint.mint.ink}>
          {entitlement?.expirationDate
              ? `${entitlement.willRenew ? 'Renews' : 'Access until'} ${new Date(entitlement.expirationDate).toLocaleDateString()}.`
              : 'Active.'}
        </T>
      </View>

      <PlanPicker />

      <T token="caption" color={c.inkSecondary}>
        Plans renew automatically unless canceled in your store account. Student pricing is on the honor system. Prices and any eligible offers are shown before you confirm.
      </T>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingHorizontal: SCREEN_GUTTER, paddingBottom: 48, gap: 20 },
  status: { padding: 18, borderRadius: radius.card, gap: 4 },
});
