import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Purchases from 'react-native-purchases';

import { TextButton } from '@/components/Controls';
import { Group, Row } from '@/components/Settings';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { PRO_ENTITLEMENT, usingTestStore } from '@/lib/revenuecat';
import { usePurchases } from '@/providers/PurchasesProvider';
import { SCREEN_GUTTER, useTheme } from '@/theme';

/**
 * What the store told the app, verbatim: the screen to screenshot when a purchase went through
 * at Apple but Plus did not switch on. Each row answers one question: did RevenueCat see the
 * purchase at all (products), and did it map it to the entitlement (semli_pro).
 */
export default function PlanStatusScreen() {
  const { c } = useTheme();
  const { customerInfo, isPro, loading, error, refreshCustomerInfo, restore } = usePurchases();
  const [appUserId, setAppUserId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => { void Purchases.getAppUserID().then(setAppUserId).catch(() => setAppUserId(null)); }, [customerInfo]);
  const ent = customerInfo?.entitlements.all[PRO_ENTITLEMENT];
  const when = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString() : 'none');
  const act = async (label: string, fn: () => Promise<unknown>) => {
    feedback('tap');
    setNote(null);
    try { await fn(); setNote(`${label} done.`); } catch { setNote(`${label} failed; see the error above.`); }
  };

  return (
    <ScrollView contentContainerStyle={styles.body} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.top}>
        <T token="callout" color={c.inkSecondary}>{loading ? 'Asking the store…' : 'As the store last reported it'}</T>
        <T token="displayXl">{isPro ? 'Plus is on' : 'Plus is off'}</T>
        <T token="body" color={c.inkSecondary} style={styles.line}>
          {isPro ? 'The store confirms an active Semli Plus entitlement on this phone.'
            : customerInfo?.activeSubscriptions.length ? 'The store sees a subscription but it is not linked to Semli Plus. That is a RevenueCat setup gap, not a purchase problem.'
            : customerInfo ? 'The store sees no subscription for this app user. A purchase made under another Apple ID or app user needs Restore.'
            : 'No answer from the store yet.'}
        </T>
        {error ? <T token="callout" color={c.conflict} accessibilityRole="alert">{error}</T> : null}
      </View>

      <Group title="Entitlement">
        <Row label={PRO_ENTITLEMENT} value={ent ? (ent.isActive ? 'Active' : 'Inactive') : 'Not present'} />
        <Row label="Product" value={ent?.productIdentifier ?? 'none'} />
        <Row label="Expires" value={when(ent?.expirationDate)} />
        <Row label="Renews" value={ent ? (ent.willRenew ? 'Yes' : 'No') : 'n/a'} />
        <Row label="Period" value={ent?.periodType ?? 'n/a'} />
        <Row label="Sandbox" value={ent ? (ent.isSandbox ? 'Yes' : 'No') : 'n/a'} last />
      </Group>

      <Group title="Purchases the store sees">
        <Row label="Active subscriptions" value={customerInfo?.activeSubscriptions.join(', ') || 'none'} />
        <Row label="Ever purchased" value={customerInfo?.allPurchasedProductIdentifiers.join(', ') || 'none'} />
        <Row label="Latest expiry" value={when(customerInfo?.latestExpirationDate)} last />
      </Group>

      <Group title="Identity">
        <Row label="App user id" value={appUserId ?? '…'} />
        <Row label="Original app user id" value={customerInfo?.originalAppUserId ?? '…'} />
        <Row label="First seen" value={when(customerInfo?.firstSeen)} />
        <Row label="Last checked" value={when(customerInfo?.requestDate)} last />
      </Group>

      <Group title="Build" footer={note ?? undefined}>
        <Row label="Store key" value={usingTestStore ? 'RevenueCat Test Store' : 'App Store'} />
        <Row label="Version" value={`${Constants.expoConfig?.version ?? ''} (${Constants.expoConfig?.ios?.buildNumber ?? '?'})`} last />
      </Group>

      <View style={styles.actions}>
        <TextButton label="Check again" onPress={() => void act('Check', refreshCustomerInfo)} />
        <TextButton label="Restore purchases" tone="muted" onPress={() => void act('Restore', restore)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 8, paddingBottom: 48, gap: 22 },
  top: { gap: 2 },
  line: { fontSize: 18, lineHeight: 26, letterSpacing: -0.2, paddingTop: 6 },
  actions: { flexDirection: 'row', gap: 20, alignItems: 'center' },
});
