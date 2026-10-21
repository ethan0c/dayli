import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

import { StatusPill } from '@/components/Controls';
import { NativeToggle } from '@/components/Native';
import { Press } from '@/components/Press';
import { PlusFeatures, PlusWelcome } from '@/components/PlusWelcome';
import { Skeleton } from '@/components/Skeleton';
import { T } from '@/components/Text';
import { track } from '@/lib/analytics';
import { feedback } from '@/lib/feedback';
import { LINKS, openLink } from '@/lib/links';
import { PRO_ENTITLEMENT, customerCenterEnabled, hasSemliPro, offeringFor, usingTestStore } from '@/lib/revenuecat';
import { usePurchases } from '@/providers/PurchasesProvider';
import { useStore } from '@/store';
import { useTheme, type Palette } from '@/theme';

/** The three Semli Plus terms. Packages come from RevenueCat; see docs/revenuecat-offerings-brief.md. */
const TERMS = [
  { key: 'monthly', label: 'Monthly', period: '/ month', billed: 'a month', months: 1, pick: (o: PurchasesOffering | null) => o?.monthly ?? null },
  // Apple has no four-month term: the semester plan is a six-month subscription and every price line says so.
  { key: 'semester', label: 'Semester', period: '/ 6 months', billed: 'every 6 months', months: 6, pick: (o: PurchasesOffering | null) => o?.sixMonth ?? null },
  { key: 'yearly', label: 'Yearly', period: '/ year', billed: 'a year', months: 12, pick: (o: PurchasesOffering | null) => o?.annual ?? null },
] as const;

type TermKey = (typeof TERMS)[number]['key'];

function trialDays(pack: PurchasesPackage | null | undefined): number | null {
  const intro = pack?.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const n = intro.periodNumberOfUnits;
  const unit = intro.periodUnit.toLowerCase();
  return unit === 'day' ? n : unit === 'week' ? n * 7 : unit === 'month' ? n * 30 : null;
}

function symbolOf(pack: PurchasesPackage): string {
  return pack.product.priceString.replace(/[\d.,\s]/g, '') || '$';
}

function perMonth(pack: PurchasesPackage, months: number): string {
  return `${symbolOf(pack)}${(pack.product.price / months).toFixed(2)} / mo`;
}

/** Shared purchase controls for the photographic onboarding, settings and gated paywalls. */
export function PlanPicker({ onContinueFree, onComplete, onWelcome, freeImportsLeft, palette }: {
  onContinueFree?: () => void; onComplete?: () => void; onWelcome?: () => void; freeImportsLeft?: number; palette?: Palette;
}) {
  const theme = useTheme();
  const c = palette ?? theme.c;
  const { offering, offerings, customerInfo, isPro, loading, busy, error, unavailableReason, refresh, purchase, restore, manageSubscription } = usePurchases();
  const student = useStore((s) => s.settings.isStudent);
  const setSettings = useStore((s) => s.setSettings);
  const [welcome, setWelcome] = useState<'celebrate' | 'tour' | null>(null);
  const [previewPlans, setPreviewPlans] = useState(false);
  const actionInProgress = useRef(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [term, setTerm] = useState<TermKey>('semester');
  const disabled = busy || loading || !!unavailableReason;

  const other = offeringFor(offerings, !student);
  const plans = TERMS.map((t) => ({ ...t, pack: t.pick(offering), otherPack: t.pick(other) }));
  const current = plans.find((p) => p.key === term && p.pack) ?? plans.find((p) => p.pack) ?? null;
  const selected = current?.pack ?? null;
  const days = trialDays(selected);
  const monthly = plans.find((p) => p.key === 'monthly')?.pack ?? null;
  const entitlement = customerInfo?.entitlements.active[PRO_ENTITLEMENT];

  const showWelcome = (stage: 'celebrate' | 'tour') => { setWelcome(stage); onWelcome?.(); };

  async function buyPlan() {
    if (!selected || !current || actionInProgress.current || previewPlans) return;
    actionInProgress.current = true;
    setNotice(null);
    try {
      const info = await purchase(selected);
      if (!info) return;
      if (hasSemliPro(info)) {
        showWelcome('celebrate');
        feedback('success');
        track('purchase_completed', { term: current.key, student, trial: !!days });
        const ends = info.entitlements.active[PRO_ENTITLEMENT]?.expirationDate;
        if (days && ends) setSettings({ trial: { endsAt: ends, label: `${selected.product.priceString} ${current.billed}` } });
      } else setNotice('Your purchase finished, but Plus is not active yet. Try Restore, or email hello@semli.app.');
    } catch {
      // The provider exposes actionable failures in `error`.
    } finally {
      actionInProgress.current = false;
    }
  }

  async function restorePlan() {
    if (actionInProgress.current) return;
    actionInProgress.current = true;
    setNotice(null);
    try {
      const info = await restore();
      if (hasSemliPro(info)) track('purchase_restored', {});
      setNotice(hasSemliPro(info) ? 'Your Semli Plus purchase is restored.' : 'No Semli Plus purchases were found for this store account.');
    } catch {
      // The provider displays a friendly error.
    } finally {
      actionInProgress.current = false;
    }
  }

  const legal = async (url: string) => {
    if (!(await openLink(url))) setNotice('We couldn’t open that page. It is at semli.app.');
  };

  if (welcome) return <PlusWelcome stage={welcome} onTour={() => showWelcome('tour')}
    onDone={() => { if (onComplete) onComplete(); else { setWelcome(null); onWelcome?.(); } }} c={c} />;

  if (isPro && !previewPlans) {
    return (
      <View style={{ gap: 22 }}>
        <View style={{ gap: 2 }}>
          <T token="callout" color={c.inkSecondary}>Semli <T token="callout" color={c.accentInk}>Plus</T> · Active</T>
          <T token="displayXl" color={c.inkPrimary}>Unlimited</T>
          <T token="callout" color={c.inkSecondary} style={{ paddingTop: 4 }}>
            {entitlement?.expirationDate ? `${entitlement.willRenew ? 'Renews' : 'Access until'} ${new Date(entitlement.expirationDate).toLocaleDateString()}.` : 'Every syllabus, schedule and screenshot read for you.'}
          </T>
        </View>
        <PlusFeatures c={c} />
        <Press accessibilityRole="button" onPress={() => showWelcome('tour')} style={[styles.cta, { backgroundColor: c.controlFill }]}>
          <T token="headline" color={c.controlInk}>Explore your Plus features</T>
        </Press>
        {onComplete ? <Press accessibilityRole="button" onPress={onComplete} style={styles.textBtn}><T token="subhead" color={c.inkSecondary}>Continue</T></Press> : null}
        {customerCenterEnabled || customerInfo?.managementURL ? (
          <Press accessibilityRole="button" disabled={disabled} onPress={() => { setNotice(null); void manageSubscription().catch(() => {}); }} style={styles.textBtn}>
            <T token="subhead" color={c.inkSecondary}>{busy ? 'Opening…' : 'Manage subscription'}</T>
          </Press>
        ) : null}
        {__DEV__ ? <Press accessibilityRole="button" onPress={() => showWelcome('celebrate')} style={styles.textBtn}><T token="caption" color={c.inkSecondary}>Preview welcome · development only</T></Press> : null}
        {__DEV__ ? <Press accessibilityRole="button" onPress={() => { setPreviewPlans(true); onWelcome?.(); }} style={styles.textBtn}><T token="caption" color={c.inkSecondary}>Preview paywall · development only</T></Press> : null}
        {notice || error ? <T token="caption" color={c.inkSecondary} accessibilityRole="alert">{notice ?? error}</T> : null}
        <Links onRestore={() => void restorePlan()} onLegal={legal} disabled={disabled} c={c} />
      </View>
    );
  }

  return (
    <View style={{ gap: 28 }}>
      {previewPlans ? <Press accessibilityRole="button" onPress={() => setPreviewPlans(false)} style={styles.textBtn}><T token="caption" color={c.accentInk}>End preview · purchases disabled</T></Press> : null}
      <View style={{ gap: 12 }}>
        <T token="displaySerif" color={c.inkPrimary}>More life. Less juggling.</T>
        <T token="callout" color={c.inkSecondary}>
          Semli <T token="callout" color={c.accentInk}>Plus</T>{days ? ` · ${days} days free, then` : ''}
        </T>
        {loading ? (
          <Skeleton width={180} height={48} round={12} />
        ) : (
          <View style={styles.priceRow}>
            <T token="displayXl" color={c.inkPrimary} tabular adjustsFontSizeToFit minimumFontScale={0.6} numberOfLines={1} style={{ flexShrink: 1 }}>{selected?.product.priceString ?? '—'}</T>
            {current ? <T token="title" color={c.inkSecondary} style={{ paddingBottom: 6 }}>{current.period}</T> : null}
          </View>
        )}
        <T token="callout" color={c.inkSecondary} style={{ paddingTop: 4 }}>
          Unlimited imports, Canvas kept in sync, updates to your work schedule, suggested times for overlapping plans, and urgent items that ring like an alarm. Calendar, to-dos, reminders and overlap warnings stay free forever.
        </T>
      </View>

      <View accessibilityRole="radiogroup" accessibilityLabel="Choose a Semli Plus plan">
        {plans.map(({ key, label, pack, months }) => {
          const on = !!pack && current?.key === key;
          const saving = pack && monthly && months > 1 ? Math.round((1 - pack.product.price / months / monthly.product.price) * 100) : 0;
          return (
            <Pressable key={key} accessibilityRole="radio" accessibilityLabel={`${label}, ${pack?.product.priceString ?? 'price unavailable'}`}
              accessibilityState={{ selected: on, disabled: disabled || !pack }} disabled={disabled || !pack}
              onPress={() => { setTerm(key); feedback('select'); setNotice(null); }}
              style={({ pressed }) => [styles.planRow, { borderBottomColor: c.line, opacity: pressed ? 0.7 : !pack && !loading ? 0.4 : 1 }]}>
              <View style={[styles.radio, on ? { backgroundColor: c.controlFill } : { borderWidth: 1.5, borderColor: c.controlOutline }]}>
                {on ? <View style={[styles.radioDot, { backgroundColor: c.controlInk }]} /> : null}
              </View>
              <T token="body" color={c.inkPrimary} style={{ flex: 1 }}>{label}</T>
              {saving >= 5 ? <StatusPill label={`Save ${saving}%`} tone="green" tabular={false} /> : null}
              <T token="callout" color={c.inkSecondary} tabular>{pack ? (months > 1 ? perMonth(pack, months) : `${pack.product.priceString} / mo`) : loading ? '' : 'Unavailable'}</T>
              {!pack && loading ? <Skeleton width={64} height={14} round={7} /> : null}
            </Pressable>
          );
        })}
        <View style={styles.studentRow}>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <T token="body" color={c.inkPrimary}>{"I'm a college student"}</T>
            <T token="caption" color={c.inkSecondary}>{`We don't check. ${current?.otherPack && student ? `Regular price is ${current.otherPack.product.priceString}.` : current?.otherPack && !student ? `Students pay ${current.otherPack.product.priceString}.` : 'Regular pricing is a little higher.'}`}</T>
          </View>
          <NativeToggle label="I'm a college student" value={student} activeColor={c.added} onChange={(v) => { feedback('select'); setNotice(null); setSettings({ isStudent: v }); }} />
        </View>
      </View>

      {days && selected && current ? (
        <View style={{ gap: 16 }}>
          {[
            { when: 'Today', what: 'Everything in Plus, free.', color: c.added },
            { when: `Day ${Math.max(1, days - 2)}`, what: 'Trial reminder, if notifications are enabled.', color: c.changed },
            { when: `Day ${days}`, what: `${selected.product.priceString} ${current.billed}. Cancel before and pay nothing.`, color: c.inkPrimary },
          ].map((r) => (
            <View key={r.when} style={styles.timelineRow}>
              <View style={[styles.timelineDot, { backgroundColor: r.color }]} />
              <T token="subhead" color={c.inkPrimary} style={{ width: 54 }}>{r.when}</T>
              <T token="callout" color={c.inkSecondary} style={{ flex: 1 }}>{r.what}</T>
            </View>
          ))}
        </View>
      ) : null}

      {!loading && !unavailableReason && !offering?.availablePackages.length && !error ? (
        <T token="callout" color={c.inkSecondary}>Plans aren’t available right now. You can keep using Semli for free.</T>
      ) : null}
      {unavailableReason || error || notice ? <T token="caption" color={c.inkSecondary} accessibilityRole="alert">{unavailableReason ?? error ?? notice}</T> : null}

      <View style={{ gap: 12, paddingTop: 4, alignItems: 'center' }}>
        <Press haptic="tap" accessibilityRole="button" accessibilityState={{ disabled: disabled || !selected || previewPlans }} disabled={disabled || !selected || previewPlans} onPress={() => void buyPlan()}
          style={[styles.cta, { backgroundColor: c.controlFill, opacity: disabled || !selected || previewPlans ? 0.4 : 1 }]}>
          <T token="headline" color={c.controlInk}>{busy ? 'One moment…' : days ? 'Start free trial' : 'Get Semli Plus'}</T>
        </Press>
        <T token="caption" color={c.inkSecondary} style={styles.center}>
          {selected && current ? `${days ? `${days}-day free trial, then ` : ''}${selected.product.priceString} ${current.billed}. Auto-renews. Cancel any time.` : 'Prices are shown before you confirm.'}
        </T>
        {onContinueFree ? (
          <Pressable accessibilityRole="button" disabled={busy} onPress={onContinueFree} style={styles.textBtn}>
            <T token="subhead" color={c.inkSecondary}>{`Continue free${freeImportsLeft !== undefined ? ` · ${freeImportsLeft} free ${freeImportsLeft === 1 ? 'import' : 'imports'} left` : ' · 5 imports to start, then 3 a month'}`}</T>
          </Pressable>
        ) : null}
        {!unavailableReason && (error || !offering) ? (
          <Pressable accessibilityRole="button" onPress={() => { setNotice(null); void refresh(); }} style={styles.textBtn}>
            <T token="subhead" color={c.inkSecondary}>Refresh plans</T>
          </Pressable>
        ) : null}
        <Links onRestore={() => void restorePlan()} onLegal={legal} disabled={disabled} c={c} />
        {usingTestStore && !unavailableReason ? <T token="caption" color={c.inkSecondary} style={styles.center}>Test purchases don’t charge you.</T> : null}
      </View>
    </View>
  );
}

function Links({ onRestore, onLegal, disabled, c }: { onRestore: () => void; onLegal: (url: string) => void; disabled: boolean; c: Palette }) {
  return (
    <View style={styles.links}>
      <Pressable accessibilityRole="button" disabled={disabled} onPress={onRestore} style={styles.link}><T token="caption" color={c.inkSecondary}>Restore</T></Pressable>
      <T token="caption" color={c.inkTertiary}>·</T>
      <Pressable accessibilityRole="link" onPress={() => onLegal(LINKS.terms)} style={styles.link}><T token="caption" color={c.inkSecondary}>Terms</T></Pressable>
      <T token="caption" color={c.inkTertiary}>·</T>
      <Pressable accessibilityRole="link" onPress={() => onLegal(LINKS.privacy)} style={styles.link}><T token="caption" color={c.inkSecondary}>Privacy</T></Pressable>
    </View>
  );
}

/** Closes the paywall wherever it was opened from. */
export function closePaywall() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

const styles = StyleSheet.create({
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  cta: { alignSelf: 'stretch', minHeight: 52, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingVertical: 12, flexWrap: 'wrap', borderBottomWidth: StyleSheet.hairlineWidth },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 16 },
  radio: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 7, height: 7, borderRadius: 4 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 32 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  center: { textAlign: 'center' },
  textBtn: { minHeight: 44, justifyContent: 'center' },
  links: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  link: { minHeight: 36, paddingHorizontal: 12, justifyContent: 'center' },
});
