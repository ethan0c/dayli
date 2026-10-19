import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Button } from '@/components/Sheet';
import { T } from '@/components/Text';
import { Wordmark } from '@/components/Wordmark';
import { feedback } from '@/lib/feedback';
import { customerCenterEnabled, hasSemliPro, usingTestStore } from '@/lib/revenuecat';
import { usePurchases } from '@/providers/PurchasesProvider';
import { radius, useTheme } from '@/theme';

const LEGAL_BASE = 'https://semli.app';

/** Branded paywall backed by RevenueCat packages, with the hosted paywall available as well. */
export function PlanPicker({ hero = false }: { hero?: boolean }) {
  const { c } = useTheme();
  const { offering, customerInfo, isPro, loading, busy, error, unavailableReason, refresh, purchase, presentPaywall, restore, manageSubscription } = usePurchases();
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const disabled = busy || loading || !!unavailableReason;
  const plans = [
    { label: 'Monthly', period: 'Billed every month', pack: offering?.monthly },
    { label: 'Yearly', period: 'Billed once a year', pack: offering?.annual },
    { label: 'Lifetime', period: 'One payment. Yours for good.', pack: offering?.lifetime },
  ];
  const selected = plans.find(({ pack }) => pack && pack.identifier === selectedId)?.pack
    ?? offering?.annual ?? offering?.monthly ?? offering?.lifetime;
  const selectedPlan = plans.find(({ pack }) => pack && pack.identifier === selected?.identifier);

  async function buyPlan() {
    if (!selected) return;
    setNotice(null);
    try {
      const info = await purchase(selected);
      if (!info) return; // User canceled the store sheet.
      if (hasSemliPro(info)) feedback('success');
      else setNotice('Your purchase finished, but Pro is not active yet. Try Restore purchases or contact support.');
    } catch {
      // Actionable failures are displayed by the provider's shared error below.
    }
  }

  async function restorePlan() {
    setNotice(null);
    try {
      const info = await restore();
      setNotice(hasSemliPro(info) ? 'Your Semli Pro purchase is restored.' : 'No Semli Pro purchases were found for this store account.');
    } catch {
      // The provider displays a friendly error.
    }
  }

  async function openLegal(path: 'privacy' | 'terms') {
    try {
      await Linking.openURL(`${LEGAL_BASE}/${path}`);
    } catch {
      setNotice('We couldn’t open that page. Please try again.');
    }
  }

  return (
    <View style={{ gap: 20 }}>
      {hero && !isPro ? <PaywallHero /> : null}
      {!isPro ? (
        <>
          <View style={styles.benefits}>
            {['Unlimited AI imports', 'Syllabi, screenshots, and messages', 'More time for everything else'].map((benefit) => (
              <View key={benefit} style={styles.benefit}>
                <Icon name="tick" size={17} color={c.accentInk} />
                <T token="callout">{benefit}</T>
              </View>
            ))}
          </View>
          <View style={{ gap: 10 }} accessibilityRole="radiogroup" accessibilityLabel="Choose a Semli Pro plan">
            {plans.map(({ label, period, pack }) => {
              const on = !!pack && selected?.identifier === pack.identifier;
              return (
                <Pressable
                  key={label}
                  disabled={disabled || !pack}
                  accessibilityRole="radio"
                  accessibilityLabel={`${label}, ${pack?.product.priceString ?? 'price unavailable'}, ${period}`}
                  accessibilityState={{ selected: on, disabled: disabled || !pack }}
                  onPress={() => {
                    if (pack) setSelectedId(pack.identifier);
                    feedback('select');
                    setNotice(null);
                  }}
                  style={({ pressed }) => [styles.plan, {
                    backgroundColor: on ? c.accentSoft : c.canvas,
                    borderColor: on ? c.accent : c.line,
                    opacity: pressed ? 0.75 : 1,
                  }]}>
                  <View style={[styles.radio, { borderColor: on ? c.accent : c.inkTertiary, backgroundColor: on ? c.accent : 'transparent' }]}>
                    {on ? <Icon name="tick" size={12} strokeWidth={2.5} color={c.canvas} /> : null}
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <T token="headline">{label}</T>
                    <T token="caption" color={c.inkSecondary}>{period}</T>
                  </View>
                  <T token="headline" tabular>{pack?.product.priceString ?? '—'}</T>
                </Pressable>
              );
            })}
          </View>
          <View style={{ gap: 10 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: disabled || !selected }}
              disabled={disabled || !selected}
              onPress={() => void buyPlan()}
              style={({ pressed }) => [styles.cta, { backgroundColor: c.accent, opacity: disabled || !selected ? 0.45 : pressed ? 0.8 : 1 }]}>
              {busy ? <ActivityIndicator color={c.canvas} /> : <Icon name="sparkle" size={20} color={c.canvas} />}
              <T token="headline" color={c.canvas}>Get Semli Pro</T>
            </Pressable>
            <T token="caption" color={c.inkSecondary} style={styles.center}>
              {selectedPlan?.label === 'Lifetime'
                ? `${selected?.product.priceString} once. No recurring payments.`
                : selected
                  ? `${selected.product.priceString} ${selectedPlan?.label === 'Yearly' ? 'per year' : 'per month'}. Renews automatically. Cancel anytime.`
                  : 'Choose the plan that fits your life.'}
            </T>
          </View>
        </>
      ) : null}
      {loading ? <ActivityIndicator accessibilityLabel="Loading plans" color={c.accent} /> : null}
      {unavailableReason || error ? (
        <T token="callout" color={c.inkSecondary} accessibilityRole="alert">{unavailableReason ?? error}</T>
      ) : null}
      {!loading && !unavailableReason && !isPro && !offering?.availablePackages.length && !error ? (
        <T token="callout" color={c.inkSecondary}>Plans aren’t available right now. You can keep using Semli for free.</T>
      ) : null}
      {notice ? <T token="callout" accessibilityLiveRegion="polite">{notice}</T> : null}
      {customerCenterEnabled || customerInfo?.managementURL ? (
        <Button label={busy ? 'Updating your plan…' : 'Manage subscription'} variant="ghost" disabled={disabled} onPress={() => {
          setNotice(null);
          void manageSubscription().catch(() => {});
        }} />
      ) : null}
      <View style={styles.links}>
        <Pressable accessibilityRole="button" disabled={disabled} onPress={() => void restorePlan()} style={styles.link}>
          <T token="caption" color={c.inkSecondary}>Restore purchases</T>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => void openLegal('terms')} style={styles.link}>
          <T token="caption" color={c.inkSecondary}>Terms</T>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => void openLegal('privacy')} style={styles.link}>
          <T token="caption" color={c.inkSecondary}>Privacy</T>
        </Pressable>
      </View>
      {!isPro ? (
        <Pressable accessibilityRole="button" disabled={disabled || !offering?.availablePackages.length} onPress={() => {
          setNotice(null);
          void presentPaywall().catch(() => {});
        }} style={styles.secondaryLink}>
          <T token="caption" color={c.inkSecondary}>View offers in the store paywall</T>
        </Pressable>
      ) : null}
      {!unavailableReason && (error || !offering) ? <Button label="Refresh plan" variant="ghost" disabled={busy || loading} onPress={() => {
        setNotice(null);
        void refresh();
      }} /> : null}
      {usingTestStore && !unavailableReason ? <T token="caption" color={c.inkSecondary} style={styles.center}>Test purchases don’t charge you.</T> : null}
    </View>
  );
}

function PaywallHero() {
  const { c } = useTheme();
  return (
    <View style={{ gap: 24 }}>
      <View style={styles.brand}>
        <Wordmark width={92} ink={c.inkPrimary} />
        <View style={[styles.pro, { backgroundColor: c.accentSoft }]}><T token="subhead" color={c.accentInk}>Pro</T></View>
      </View>
      <View style={[styles.preview, { backgroundColor: c.accentSoft }]} accessible accessibilityLabel="A syllabus becomes a calm, organized day in Semli">
        <View style={styles.previewHead}>
          <View>
            <T token="caption" color={c.accentInk}>A little more breathing room</T>
            <T token="title" color={c.accentInk} style={{ marginTop: 4 }}>Your day, sorted.</T>
          </View>
          <Icon name="sparkle" color={c.accentInk} size={28} />
        </View>
        <View style={[styles.previewEvent, { backgroundColor: c.tint.lavender.fill }]}>
          <Icon name="book" color={c.tint.lavender.ink} size={17} />
          <T token="subhead" color={c.tint.lavender.ink} style={{ flex: 1 }}>Biology lecture</T>
          <View style={[styles.time, { backgroundColor: c.canvas }]}><T token="caption">10–11</T></View>
        </View>
        <View style={[styles.previewEvent, { backgroundColor: c.surface }]}>
          <Icon name="check" color={c.inkSecondary} size={17} />
          <T token="subhead" style={{ flex: 1 }}>Hand in your essay</T>
          <Icon name="tick" color={c.accentInk} size={17} />
        </View>
        <T token="caption" color={c.accentInk} style={{ marginTop: 2 }}>From one syllabus. Without all the typing.</T>
      </View>
      <View style={{ gap: 10 }}>
        <T token="display" style={{ fontSize: 38, lineHeight: 43, letterSpacing: -1.4 }}>Make room{ '\n' }for your life.</T>
        <T token="callout" color={c.inkSecondary}>Less copying dates. More being there.{ '\n' }Let Semli take the planning off your plate.</T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pro: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  preview: { padding: 18, borderRadius: 24, gap: 8 },
  previewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  previewEvent: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 46, padding: 10, borderRadius: 12 },
  time: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  benefits: { gap: 12 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.row, borderWidth: 1.5, minHeight: 78 },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 56, borderRadius: radius.pill, padding: 14 },
  center: { textAlign: 'center' },
  links: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  link: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
  secondaryLink: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: -12 },
});
