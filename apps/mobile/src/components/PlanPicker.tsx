import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { NativeToggle } from '@/components/Native';
import { Button } from '@/components/Sheet';
import { T } from '@/components/Text';
import { Wordmark } from '@/components/Wordmark';
import { track } from '@/lib/analytics';
import { feedback } from '@/lib/feedback';
import { PRO_ENTITLEMENT, customerCenterEnabled, hasSemliPro, offeringFor, usingTestStore } from '@/lib/revenuecat';
import { usePurchases } from '@/providers/PurchasesProvider';
import { useStore } from '@/store';
import { SCREEN_GUTTER, useTheme } from '@/theme';

/** The three Semli Plus terms. Packages come from RevenueCat; see docs/revenuecat-offerings-brief.md. */
const TERMS = [
  { key: 'monthly', label: 'Monthly', period: '/ month', months: 1, pick: (o: PurchasesOffering | null) => o?.monthly ?? null },
  { key: 'semester', label: 'Semester', period: '/ 6 months', months: 6, pick: (o: PurchasesOffering | null) => o?.sixMonth ?? null },
  { key: 'yearly', label: 'Yearly', period: '/ year', months: 12, pick: (o: PurchasesOffering | null) => o?.annual ?? null },
] as const;

type TermKey = (typeof TERMS)[number]['key'];

function trialLabel(pack: PurchasesPackage | null | undefined): string | null {
  const intro = pack?.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const n = intro.periodNumberOfUnits;
  const unit = intro.periodUnit.toLowerCase();
  const days = unit === 'day' ? n : unit === 'week' ? n * 7 : null;
  return days ? `${days}-day free trial` : 'Free trial';
}

function perMonth(pack: PurchasesPackage, months: number): string | null {
  if (months <= 1) return null;
  const amount = pack.product.price / months;
  const symbol = pack.product.priceString.replace(/[\d.,\s]/g, '') || '$';
  return `${symbol}${amount.toFixed(2)} a month`;
}

/** A compact, price-led paywall. The docked variant keeps checkout visible on small screens. */
export function PlanPicker({ hero = false, docked = false, freeImportsLeft }: { hero?: boolean; docked?: boolean; freeImportsLeft?: number }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { offering, offerings, customerInfo, isPro, loading, busy, error, unavailableReason, refresh, purchase, restore, manageSubscription } = usePurchases();
  const student = useStore((s) => s.settings.isStudent);
  const setSettings = useStore((s) => s.setSettings);
  const [notice, setNotice] = useState<string | null>(null);
  const [term, setTerm] = useState<TermKey>('semester');
  const disabled = busy || loading || !!unavailableReason;

  const other = offeringFor(offerings, !student);
  const plans = TERMS.map((t) => ({ ...t, pack: t.pick(offering), otherPack: t.pick(other) }));
  const current = plans.find((p) => p.key === term && p.pack) ?? plans.find((p) => p.pack) ?? null;
  const selected = current?.pack ?? null;
  const trial = trialLabel(selected);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  async function buyPlan() {
    if (!selected) return;
    setNotice(null);
    try {
      const info = await purchase(selected);
      if (!info) return;
      if (hasSemliPro(info)) {
        feedback('success');
        track('purchase_completed', { term: current?.key ?? 'unknown', student, trial: !!trial });
        const ends = info.entitlements.active[PRO_ENTITLEMENT]?.expirationDate;
        if (trial && ends && selected && current) {
          setSettings({ trial: { endsAt: ends, label: `${selected.product.priceString} ${current.period.replace('/ ', 'per ')}` } });
        }
      }
      else setNotice('Your purchase finished, but Plus is not active yet. Try Restore purchases or contact support.');
    } catch {
      // The provider exposes actionable failures in error.
    }
  }

  async function restorePlan() {
    setNotice(null);
    try {
      const info = await restore();
      if (hasSemliPro(info)) track('purchase_restored', {});
      setNotice(hasSemliPro(info) ? 'Your Semli Plus purchase is restored.' : 'No Semli Plus purchases were found for this store account.');
    } catch {
      // The provider displays a friendly error.
    }
  }

  async function openLegal(path: 'privacy' | 'terms') {
    try {
      await Linking.openURL(`https://semli.app/${path}`);
    } catch {
      setNotice('We couldn’t open that page. Please try again.');
    }
  }

  const content = (
    <View style={{ gap: 20 }}>
      {hero && !isPro ? (
        <View style={styles.hero}>
          {!docked ? (
            <View style={styles.brand}>
              <Wordmark width={92} ink={c.inkPrimary} />
              <T token="subhead" color={c.accentInk}>
                Plus
              </T>
            </View>
          ) : null}
          <T token="display" style={styles.heroTitle}>
            More life.{'\n'}Less planning.
          </T>
          <T token="callout" color={c.inkSecondary} style={styles.heroDetail}>
            Your syllabus. Your shifts. Your plans.{'\n'}Let Semli do the copying.
          </T>
        </View>
      ) : null}

      {!isPro ? (
        <View style={[styles.studentRow, { backgroundColor: student ? c.accentSoft : c.row, borderColor: student ? c.accentBorder : 'transparent' }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <T token="headline">{"I'm a college student"}</T>
            <T token="caption" color={c.inkSecondary}>
              {"We don't check IDs or .edu emails. We trust you. Not a student anymore? Switch this off and pay the regular price."}
            </T>
          </View>
          <NativeToggle
            value={student}
            onChange={(v) => {
              feedback('select');
              setNotice(null);
              setSettings({ isStudent: v });
            }}
          />
        </View>
      ) : null}

      {!isPro ? (
        <View style={[styles.priceCard, { backgroundColor: c.row }]}>
          <View style={styles.cardHeading}>
            <View style={styles.brand}>
              <Icon name="sparkle" size={17} color={c.accentInk} />
              <T token="subhead" color={c.accentInk}>
                Semli Plus
              </T>
            </View>
            <T token="caption" color={c.inkSecondary}>
              {student ? 'Student pricing' : 'Regular pricing'}
            </T>
          </View>
          <View style={[styles.switcher, { backgroundColor: c.canvas }]} accessibilityRole="radiogroup" accessibilityLabel="Choose a Semli Plus plan">
            {plans.map(({ key, label, pack }) => {
              const on = !!pack && current?.key === key;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="radio"
                  accessibilityLabel={`${label}, ${pack?.product.priceString ?? 'price unavailable'}`}
                  accessibilityState={{ selected: on, disabled: disabled || !pack }}
                  disabled={disabled || !pack}
                  onPress={() => {
                    setTerm(key);
                    feedback('select');
                    setNotice(null);
                  }}
                  style={[styles.plan, { backgroundColor: on ? c.accent : 'transparent' }]}>
                  <T token="subhead" color={on ? c.onAccent : c.inkSecondary}>
                    {label}
                  </T>
                </Pressable>
              );
            })}
          </View>
          <View style={{ gap: 6 }}>
            <View style={styles.priceRow}>
              {loading ? (
                <ActivityIndicator color={c.accent} accessibilityLabel="Loading prices" />
              ) : (
                <T token="displayXl" style={styles.price} adjustsFontSizeToFit minimumFontScale={0.6} numberOfLines={1}>
                  {selected?.product.priceString ?? '—'}
                </T>
              )}
              {selected ? (
                <T token="callout" color={c.inkSecondary} style={{ marginBottom: 7 }}>
                  {current?.period}
                </T>
              ) : null}
            </View>
            <T token="caption" color={c.inkSecondary}>
              {selected && current
                ? [perMonth(selected, current.months), student && current.otherPack ? `regular ${current.otherPack.product.priceString}` : null, trial]
                    .filter(Boolean)
                    .join(' · ')
                : 'Your store sets the price.'}
            </T>
          </View>
          {trial && selected && current ? <TrialTimeline trial={trial} price={`${selected.product.priceString} ${current.period.replace('/ ', 'per ')}`} /> : null}
          <View style={[styles.benefits, { borderTopColor: c.line }]}>
            {[
              { title: 'Unlimited AI imports', detail: 'Bring your whole semester.' },
              { title: 'Screenshots, PDFs, and messages', detail: 'Your dates, without the typing.' },
              { title: 'See what changed in your work schedule', detail: 'New, moved, and dropped shifts, named.' },
            ].map(({ title, detail }) => (
              <View key={title} style={styles.benefit}>
                <View style={[styles.check, { backgroundColor: c.accentSoft }]}>
                  <Icon name="tick" size={13} color={c.accentInk} strokeWidth={2.3} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <T token="subhead">{title}</T>
                  <T token="caption" color={c.inkSecondary}>
                    {detail}
                  </T>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {isPro && (customerCenterEnabled || customerInfo?.managementURL) ? (
        <Button
          label={busy ? 'Updating your plan…' : 'Manage subscription'}
          variant="ghost"
          disabled={disabled}
          onPress={() => {
            setNotice(null);
            void manageSubscription().catch(() => {});
          }}
        />
      ) : null}
      {!loading && !unavailableReason && !isPro && !offering?.availablePackages.length && !error ? (
        <T token="callout" color={c.inkSecondary}>
          Plans aren’t available right now. You can keep using Semli for free.
        </T>
      ) : null}
    </View>
  );

  const checkout = (
    <View style={{ gap: 10 }}>
      {unavailableReason || error || notice ? (
        <T token="caption" color={c.inkSecondary} accessibilityRole="alert">
          {unavailableReason ?? error ?? notice}
        </T>
      ) : null}
      {!isPro ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: disabled || !selected }}
            disabled={disabled || !selected}
            onPress={() => void buyPlan()}
            style={({ pressed }) => [styles.cta, { backgroundColor: c.accent, opacity: disabled || !selected ? 0.4 : pressed ? 0.85 : 1 }]}>
            <T token="headline" color={c.onAccent}>
              {trial ? 'Start free trial' : 'Get Semli Plus'}
            </T>
            {busy ? <ActivityIndicator color={c.onAccent} /> : <Icon name="chevronRight" size={20} color={c.onAccent} />}
          </Pressable>
          <T token="caption" color={c.inkSecondary} style={styles.center}>
            {selected && current
              ? `${trial ? `${trial}, then ` : ''}${selected.product.priceString} ${current.period.replace('/ ', 'per ')}. Auto-renews. Cancel anytime.`
              : 'Prices are shown before you confirm.'}
          </T>
          {docked ? (
            <Pressable accessibilityRole="button" onPress={close} style={styles.free}>
              <T token="subhead" color={c.inkSecondary}>
                Continue with free{freeImportsLeft !== undefined ? ` · ${freeImportsLeft} ${freeImportsLeft === 1 ? 'import' : 'imports'} left` : ''}
              </T>
            </Pressable>
          ) : null}
        </>
      ) : null}
      <View style={styles.links}>
        <Pressable accessibilityRole="button" disabled={disabled} onPress={() => void restorePlan()} style={styles.link}>
          <T token="caption" color={c.inkSecondary}>
            Restore
          </T>
        </Pressable>
        <T token="caption" color={c.inkTertiary}>
          ·
        </T>
        <Pressable accessibilityRole="link" onPress={() => void openLegal('terms')} style={styles.link}>
          <T token="caption" color={c.inkSecondary}>
            Terms
          </T>
        </Pressable>
        <T token="caption" color={c.inkTertiary}>
          ·
        </T>
        <Pressable accessibilityRole="link" onPress={() => void openLegal('privacy')} style={styles.link}>
          <T token="caption" color={c.inkSecondary}>
            Privacy
          </T>
        </Pressable>
      </View>
      {!unavailableReason && (error || !offering) ? (
        <Button
          label="Refresh plans"
          variant="ghost"
          disabled={busy || loading}
          onPress={() => {
            setNotice(null);
            void refresh();
          }}
        />
      ) : null}
      {usingTestStore && !unavailableReason ? (
        <T token="caption" color={c.inkSecondary} style={styles.center}>
          Test purchases don’t charge you.
        </T>
      ) : null}
    </View>
  );

  if (!docked)
    return (
      <View style={{ gap: 24 }}>
        {content}
        {checkout}
      </View>
    );
  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <View style={[styles.toolbar, { paddingTop: Platform.OS === 'ios' ? 8 : insets.top + 8 }]}>
        <View style={styles.brand}>
          <Wordmark width={84} ink={c.inkPrimary} />
          <T token="subhead" color={c.accentInk}>
            Plus
          </T>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close paywall" onPress={close} style={styles.close}>
          <Icon name="x" size={21} color={c.inkSecondary} />
        </Pressable>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {content}
      </ScrollView>
      <View style={[styles.checkout, { borderTopColor: c.line, backgroundColor: c.canvas, paddingBottom: Math.max(insets.bottom, 12) }]}>{checkout}</View>
    </View>
  );
}

/** Blinkist's trick: say exactly when the reminder and the charge happen. Raised trial starts 23% there. */
function TrialTimeline({ trial, price }: { trial: string; price: string }) {
  const { c } = useTheme();
  const days = Number(trial.match(/\d+/)?.[0] ?? 7);
  const rows = [
    { when: 'Today', what: 'Everything in Plus, free.', tint: c.tint.mint },
    { when: `Day ${Math.max(1, days - 2)}`, what: 'We remind you the trial is ending.', tint: c.tint.butter },
    { when: `Day ${days}`, what: `${price}. Cancel before and you pay nothing.`, tint: c.tint.lavender },
  ];
  return (
    <View style={[styles.timeline, { borderTopColor: c.line }]}>
      {rows.map((r) => (
        <View key={r.when} style={styles.timelineRow}>
          <View style={[styles.timelineDot, { backgroundColor: r.tint.ink }]} />
          <T token="subhead" style={{ width: 54 }}>
            {r.when}
          </T>
          <T token="caption" color={c.inkSecondary} style={{ flex: 1 }}>
            {r.what}
          </T>
        </View>
      ))}
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
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, borderWidth: 1 },
  priceCard: { borderRadius: 24, padding: 20, gap: 20 },
  cardHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  switcher: { flexDirection: 'row', padding: 4, borderRadius: 15, gap: 2 },
  plan: { flex: 1, minHeight: 40, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, minHeight: 64 },
  price: { fontSize: 56, lineHeight: 64, letterSpacing: -2.5, flexShrink: 1 },
  timeline: { paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timelineDot: { width: 8, height: 8, borderRadius: 4 },
  benefits: { paddingTop: 4, gap: 14 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  check: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  checkout: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 16 },
  cta: { minHeight: 54, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  center: { textAlign: 'center' },
  free: { minHeight: 34, alignItems: 'center', justifyContent: 'center' },
  links: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  link: { minHeight: 36, paddingHorizontal: 12, justifyContent: 'center' },
});
