import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Sheet';
import { T } from '@/components/Text';
import { customerCenterEnabled, hasSemliPro, usingTestStore } from '@/lib/revenuecat';
import { usePurchases } from '@/providers/PurchasesProvider';
import { radius, useTheme } from '@/theme';

/** Prices come from the current offering; purchases run through the hosted native paywall. */
export function PlanPicker() {
  const { c } = useTheme();
  const { offering, customerInfo, isPro, loading, busy, error, unavailableReason, refresh, presentPaywall, restore, manageSubscription } = usePurchases();
  const [notice, setNotice] = useState<string | null>(null);
  const disabled = busy || loading || !!unavailableReason;
  const packages = [
    { label: 'Lifetime', period: 'One-time purchase', pack: offering?.lifetime },
    { label: 'Yearly', period: 'Billed yearly', pack: offering?.annual },
    { label: 'Monthly', period: 'Billed monthly', pack: offering?.monthly },
  ];

  async function restorePlan() {
    setNotice(null);
    try {
      const info = await restore();
      setNotice(hasSemliPro(info) ? 'Your Semli Pro purchase is restored.' : 'No Semli Pro purchases were found for this store account.');
    } catch {
      // The provider renders a friendly error shared by all subscription controls.
    }
  }

  return (
    <View style={{ gap: 12 }}>
      {!isPro ? packages.map(({ label, period, pack }) => pack ? (
        <View key={pack.identifier} style={[styles.plan, { backgroundColor: c.row }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <T token="headline">{label}</T>
            <T token="caption" color={c.inkSecondary}>{period}</T>
          </View>
          <T token="title" tabular>{pack.product.priceString}</T>
        </View>
      ) : null) : null}
      {loading || busy ? <ActivityIndicator accessibilityLabel={busy ? 'Updating your plan' : 'Loading plans'} color={c.accent} /> : null}
      {unavailableReason || error ? (
        <T token="callout" color={c.inkSecondary} accessibilityRole="alert">{unavailableReason ?? error}</T>
      ) : null}
      {!loading && !unavailableReason && !isPro && !offering?.availablePackages.length && !error ? (
        <T token="callout" color={c.inkSecondary}>Plans aren’t available right now. You can keep using Semli for free.</T>
      ) : null}
      {notice ? <T token="callout" accessibilityLiveRegion="polite">{notice}</T> : null}
      {!isPro ? (
        <Button label="View Semli Pro plans" disabled={disabled || !offering?.availablePackages.length} onPress={() => {
          setNotice(null);
          void presentPaywall().catch(() => {});
        }} />
      ) : null}
      {customerCenterEnabled || customerInfo?.managementURL ? (
        <Button label="Manage subscription" variant="ghost" disabled={disabled} onPress={() => {
          setNotice(null);
          void manageSubscription().catch(() => {});
        }} />
      ) : null}
      <Button label="Restore purchases" variant="ghost" disabled={disabled} onPress={() => void restorePlan()} />
      {!unavailableReason ? <Button label="Refresh plan" variant="ghost" disabled={busy || loading} onPress={() => {
        setNotice(null);
        void refresh();
      }} /> : null}
      {usingTestStore && !unavailableReason ? <T token="caption" color={c.inkSecondary}>Test purchases don’t charge you.</T> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.card },
});
