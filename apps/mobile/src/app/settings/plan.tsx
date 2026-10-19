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
  const { customerInfo, isPro, loading } = usePurchases();
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
      <View style={[styles.status, { backgroundColor: c.tint.mint.fill }]}>
        <T token="overline" color={c.tint.mint.ink}>
          {isPro ? 'Semli Pro' : !customerInfo && loading ? 'Checking your plan…' : !customerInfo ? 'Plan not checked' : 'Free plan'}
        </T>
        <T token="display" color={c.tint.mint.ink}>
          {isPro ? 'Unlimited imports' : `${left} ${left === 1 ? 'import' : 'imports'} left`}
        </T>
        <T token="callout" color={c.tint.mint.ink}>
          {isPro
            ? entitlement?.expirationDate
              ? `${entitlement.willRenew ? 'Renews' : 'Access until'} ${new Date(entitlement.expirationDate).toLocaleDateString()}.`
              : 'Lifetime access. No recurring payments.'
            : `${used} of ${FREE_IMPORTS_PER_MONTH} used this month. Reminders, the calendar, and to-dos are always free.`}
        </T>
      </View>

      {isPro ? <PlanPicker /> : null}

      <T token="caption" color={c.inkSecondary}>
        Monthly and yearly plans renew automatically unless canceled in your store account. Lifetime is a one-time purchase. Prices and any eligible offers are shown before you confirm.
      </T>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingHorizontal: SCREEN_GUTTER, paddingBottom: 48, gap: 20 },
  status: { padding: 18, borderRadius: radius.card, gap: 4 },
});
