import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Button } from '@/components/Sheet';
import { T } from '@/components/Text';
import { Wordmark } from '@/components/Wordmark';
import { feedback } from '@/lib/feedback';
import { customerCenterEnabled, hasSemliPro, usingTestStore } from '@/lib/revenuecat';
import { usePurchases } from '@/providers/PurchasesProvider';
import { SCREEN_GUTTER, radius, useTheme } from '@/theme';

/** A compact, price-led paywall. The docked variant keeps checkout visible on small screens. */
export function PlanPicker({ hero = false, docked = false, freeImportsLeft }: { hero?: boolean; docked?: boolean; freeImportsLeft?: number }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { offering, customerInfo, isPro, loading, busy, error, unavailableReason, refresh, purchase, restore, manageSubscription } = usePurchases();
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const disabled = busy || loading || !!unavailableReason;
  const plans = [
    { label: 'Monthly', period: '/ month', note: 'Billed monthly', pack: offering?.monthly },
    { label: 'Yearly', period: '/ year', note: 'Billed yearly', pack: offering?.annual },
    { label: 'Lifetime', period: 'once', note: 'One payment. No renewals.', pack: offering?.lifetime },
  ];
  const selected = plans.find(({ pack }) => pack && pack.identifier === selectedId)?.pack
    ?? offering?.annual ?? offering?.monthly ?? offering?.lifetime;
  const selectedPlan = plans.find(({ pack }) => pack && pack.identifier === selected?.identifier);
  const close = () => router.canGoBack() ? router.back() : router.replace('/');

  async function buyPlan() {
    if (!selected) return;
    setNotice(null);
    try {
      const info = await purchase(selected);
      if (!info) return;
      if (hasSemliPro(info)) feedback('success');
      else setNotice('Your purchase finished, but Pro is not active yet. Try Restore purchases or contact support.');
    } catch {
      // The provider exposes actionable failures in error.
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
    try { await Linking.openURL(`https://semli.app/${path}`); }
    catch { setNotice('We couldn’t open that page. Please try again.'); }
  }

  const content = (
    <View style={{ gap: 24 }}>
      {hero && !isPro ? (
        <View style={styles.hero}>
          {!docked ? <View style={styles.brand}><Wordmark width={92} ink={c.inkPrimary} /><T token="subhead" color={c.accentInk}>Pro</T></View> : null}
          <T token="display" style={styles.heroTitle}>More life.{ '\n' }Less planning.</T>
          <T token="callout" color={c.inkSecondary} style={styles.heroDetail}>Your syllabus. Your shifts. Your plans.{ '\n' }Let Semli do the copying.</T>
        </View>
      ) : null}
      {!isPro ? (
        <View style={[styles.priceCard, { backgroundColor: c.row }]}>
          <View style={styles.cardHeading}>
            <View style={styles.brand}><Icon name="sparkle" size={17} color={c.accentInk} /><T token="subhead" color={c.accentInk}>Semli Pro</T></View>
            <T token="caption" color={c.inkSecondary}>Room for everything</T>
          </View>
          <View style={[styles.switcher, { backgroundColor: c.canvas }]} accessibilityRole="radiogroup" accessibilityLabel="Choose a Semli Pro plan">
            {plans.map(({ label, pack }) => {
              const on = !!pack && selected?.identifier === pack.identifier;
              return <Pressable
                key={label}
                accessibilityRole="radio"
                accessibilityLabel={`${label}, ${pack?.product.priceString ?? 'price unavailable'}`}
                accessibilityState={{ selected: on, disabled: disabled || !pack }}
                disabled={disabled || !pack}
                onPress={() => { if (pack) setSelectedId(pack.identifier); feedback('select'); setNotice(null); }}
                style={[styles.plan, { backgroundColor: on ? c.accent : 'transparent' }]}>
                <T token="subhead" color={on ? c.canvas : c.inkSecondary}>{label}</T>
              </Pressable>;
            })}
          </View>
          <View style={{ gap: 6 }}>
            <View style={styles.priceRow}>
              {loading ? <ActivityIndicator color={c.accent} accessibilityLabel="Loading prices" /> : (
                <T token="displayXl" style={styles.price} adjustsFontSizeToFit minimumFontScale={0.6} numberOfLines={1}>{selected?.product.priceString ?? '—'}</T>
              )}
              {selected ? <T token="callout" color={c.inkSecondary} style={{ marginBottom: 7 }}>{selectedPlan?.period}</T> : null}
            </View>
            <T token="caption" color={c.inkSecondary}>{selectedPlan?.note ?? 'Your store sets the price.'}</T>
          </View>
          <View style={[styles.benefits, { borderTopColor: c.line }]}>
            {[
              { title: 'Unlimited AI imports', detail: 'Bring your whole semester.' },
              { title: 'Screenshots, PDFs, and messages', detail: 'Your dates, without the typing.' },
              { title: 'School, work, and life together', detail: 'One clear plan for all of it.' },
            ].map(({ title, detail }) => <View key={title} style={styles.benefit}>
              <View style={[styles.check, { backgroundColor: c.accentSoft }]}><Icon name="tick" size={13} color={c.accentInk} strokeWidth={2.3} /></View>
              <View style={{ flex: 1, gap: 2 }}><T token="subhead">{title}</T><T token="caption" color={c.inkSecondary}>{detail}</T></View>
            </View>)}
          </View>
        </View>
      ) : null}
      {isPro && (customerCenterEnabled || customerInfo?.managementURL) ? (
        <Button label={busy ? 'Updating your plan…' : 'Manage subscription'} variant="ghost" disabled={disabled} onPress={() => { setNotice(null); void manageSubscription().catch(() => {}); }} />
      ) : null}
      {!loading && !unavailableReason && !isPro && !offering?.availablePackages.length && !error ? (
        <T token="callout" color={c.inkSecondary}>Plans aren’t available right now. You can keep using Semli for free.</T>
      ) : null}
    </View>
  );

  const checkout = (
    <View style={{ gap: 10 }}>
      {unavailableReason || error || notice ? <T token="caption" color={c.inkSecondary} accessibilityRole="alert">{unavailableReason ?? error ?? notice}</T> : null}
      {!isPro ? <>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || !selected }} disabled={disabled || !selected} onPress={() => void buyPlan()}
          style={({ pressed }) => [styles.cta, { backgroundColor: c.accent, opacity: disabled || !selected ? 0.4 : pressed ? 0.85 : 1 }]}>
          <T token="headline" color={c.canvas}>Get Semli Pro</T>
          {busy ? <ActivityIndicator color={c.canvas} /> : <Icon name="chevronRight" size={20} color={c.canvas} />}
        </Pressable>
        <T token="caption" color={c.inkSecondary} style={styles.center}>{selectedPlan?.label === 'Lifetime'
          ? `${selected?.product.priceString} once. No recurring payments.`
          : selected ? `${selected.product.priceString} ${selectedPlan?.label === 'Yearly' ? 'per year' : 'per month'}. Auto-renews. Cancel anytime.` : 'Prices are shown before you confirm.'}</T>
        {docked ? <Pressable accessibilityRole="button" onPress={close} style={styles.free}><T token="subhead" color={c.inkSecondary}>Continue with free{freeImportsLeft !== undefined ? ` · ${freeImportsLeft} ${freeImportsLeft === 1 ? 'import' : 'imports'} left` : ''}</T></Pressable> : null}
      </> : null}
      <View style={styles.links}>
        <Pressable accessibilityRole="button" disabled={disabled} onPress={() => void restorePlan()} style={styles.link}><T token="caption" color={c.inkSecondary}>Restore</T></Pressable>
        <T token="caption" color={c.inkTertiary}>·</T>
        <Pressable accessibilityRole="link" onPress={() => void openLegal('terms')} style={styles.link}><T token="caption" color={c.inkSecondary}>Terms</T></Pressable>
        <T token="caption" color={c.inkTertiary}>·</T>
        <Pressable accessibilityRole="link" onPress={() => void openLegal('privacy')} style={styles.link}><T token="caption" color={c.inkSecondary}>Privacy</T></Pressable>
      </View>
      {!unavailableReason && (error || !offering) ? <Button label="Refresh plan" variant="ghost" disabled={busy || loading} onPress={() => { setNotice(null); void refresh(); }} /> : null}
      {usingTestStore && !unavailableReason ? <T token="caption" color={c.inkSecondary} style={styles.center}>Test purchases don’t charge you.</T> : null}
    </View>
  );

  if (!docked) return <View style={{ gap: 24 }}>{content}{checkout}</View>;
  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <View style={[styles.toolbar, { paddingTop: Platform.OS === 'ios' ? 8 : insets.top + 8 }]}>
        <View style={styles.brand}><Wordmark width={84} ink={c.inkPrimary} /><T token="subhead" color={c.accentInk}>Pro</T></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close paywall" onPress={close} style={styles.close}><Icon name="x" size={21} color={c.inkSecondary} /></Pressable>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>{content}</ScrollView>
      <View style={[styles.checkout, { borderTopColor: c.line, backgroundColor: c.canvas, paddingBottom: Math.max(insets.bottom, 12) }]}>{checkout}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { paddingHorizontal: SCREEN_GUTTER, minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 8, paddingBottom: 24 },
  hero: { alignItems: 'center', gap: 12, paddingVertical: 8 },
  heroTitle: { fontSize: 34, lineHeight: 38, letterSpacing: -1.2, textAlign: 'center' },
  heroDetail: { textAlign: 'center', fontSize: 14, lineHeight: 21 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceCard: { borderRadius: 24, padding: 20, gap: 20 },
  cardHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  switcher: { flexDirection: 'row', padding: 4, borderRadius: 15, gap: 2 },
  plan: { flex: 1, minHeight: 40, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, minHeight: 64 },
  price: { fontSize: 56, lineHeight: 64, letterSpacing: -2.5, flexShrink: 1 },
  benefits: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 18, gap: 14 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  check: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  checkout: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: SCREEN_GUTTER, paddingTop: 16 },
  cta: { minHeight: 54, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  center: { textAlign: 'center' },
  free: { minHeight: 34, alignItems: 'center', justifyContent: 'center' },
  links: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  link: { minHeight: 36, paddingHorizontal: 12, justifyContent: 'center' },
});
