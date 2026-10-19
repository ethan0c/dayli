import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

import { ListRow, StatusPill, TextButton } from '@/components/Controls';
import { NativeToggle } from '@/components/Native';
import { Press } from '@/components/Press';
import { Button } from '@/components/Sheet';
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
  { key: 'monthly', label: 'Monthly', period: '/ month', months: 1, pick: (o: PurchasesOffering | null) => o?.monthly ?? null },
  { key: 'semester', label: 'Semester', period: '/ semester', months: 6, pick: (o: PurchasesOffering | null) => o?.sixMonth ?? null },
  { key: 'yearly', label: 'Yearly', period: '/ year', months: 12, pick: (o: PurchasesOffering | null) => o?.annual ?? null },
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

/**
 * The paywall, laid out like the rest of the app: the price is the one big number, the terms
 * are rows with a radio, the student toggle is a row, the trial timeline is three lines.
 * One primary pill, then "Continue free" as a text button when the caller offers it.
 */
export function PlanPicker({ onContinueFree, freeImportsLeft, palette }: { onContinueFree?: () => void; freeImportsLeft?: number; palette?: Palette }) {
  const theme = useTheme();
  const c = palette ?? theme.c;
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
  const days = trialDays(selected);
  const monthly = plans.find((p) => p.key === 'monthly')?.pack ?? null;
  const entitlement = customerInfo?.entitlements.active[PRO_ENTITLEMENT];

  async function buyPlan() {
    if (!selected || !current) return;
    setNotice(null);
    try {
      const info = await purchase(selected);
      if (!info) return;
      if (hasSemliPro(info)) {
        feedback('success');
        track('purchase_completed', { term: current.key, student, trial: !!days });
        const ends = info.entitlements.active[PRO_ENTITLEMENT]?.expirationDate;
        if (days && ends) setSettings({ trial: { endsAt: ends, label: `${selected.product.priceString} ${current.period.replace('/ ', 'per ')}` } });
      } else setNotice('Your purchase finished, but Plus is not active yet. Try Restore, or email hello@semli.app.');
    } catch {
      // The provider exposes actionable failures in `error`.
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

  const legal = async (url: string) => {
    if (!(await openLink(url))) setNotice('We couldn’t open that page. It is at semli.app.');
  };

  if (isPro) {
    return (
      <View style={{ gap: 22 }}>
        <View style={{ gap: 2 }}>
          <T token="callout" color={c.inkSecondary}>Semli <T token="callout" color={c.accentInk}>Plus</T> · active</T>
          <T token="displayXl">Unlimited</T>
          <T token="callout" color={c.inkSecondary} style={{ paddingTop: 4 }}>
            {entitlement?.expirationDate ? `${entitlement.willRenew ? 'Renews' : 'Access until'} ${new Date(entitlement.expirationDate).toLocaleDateString()}.` : 'Every syllabus, schedule and screenshot read for you.'}
          </T>
        </View>
        {customerCenterEnabled || customerInfo?.managementURL ? (
          <Button label={busy ? 'Opening…' : 'Manage subscription'} variant="secondary" disabled={disabled} onPress={() => { setNotice(null); void manageSubscription().catch(() => {}); }} />
        ) : null}
        {notice || error ? <T token="caption" color={c.inkSecondary} accessibilityRole="alert">{notice ?? error}</T> : null}
        <Links onRestore={() => void restorePlan()} onLegal={legal} disabled={disabled} />
      </View>
    );
  }

  return (
    <View style={{ gap: 22 }}>
      <View style={{ gap: 2 }}>
        <T token="callout" color={c.inkSecondary}>
          Semli <T token="callout" color={c.accentInk}>Plus</T>{days ? ` · ${days} days free, then` : ''}
        </T>
        {loading ? (
          <Skeleton width={180} height={48} round={12} />
        ) : (
          <View style={styles.priceRow}>
            <T token="displayXl" tabular adjustsFontSizeToFit minimumFontScale={0.6} numberOfLines={1} style={{ flexShrink: 1 }}>{selected?.product.priceString ?? '—'}</T>
            {current ? <T token="title" color={c.inkSecondary} style={{ paddingBottom: 6 }}>{current.period}</T> : null}
          </View>
        )}
        <T token="callout" color={c.inkSecondary} style={{ paddingTop: 4 }}>
          Every syllabus, schedule and screenshot read for you, all term. Calendar, to-dos and reminders stay free forever.
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
              <View style={[styles.radio, on ? { backgroundColor: c.inkPrimary } : { borderWidth: 1.5, borderColor: c.controlOutline }]}>
                {on ? <View style={[styles.radioDot, { backgroundColor: c.onPrimary }]} /> : null}
              </View>
              <T token="body" style={{ flex: 1 }}>{label}</T>
              {saving >= 5 ? <StatusPill label={`Save ${saving}%`} tone="green" tabular={false} /> : null}
              <T token="callout" color={c.inkSecondary} tabular>{pack ? (months > 1 ? perMonth(pack, months) : `${pack.product.priceString} / mo`) : loading ? '…' : 'Unavailable'}</T>
            </Pressable>
          );
        })}
        <ListRow
          title="I'm a college student"
          sub={`We don't check. ${current?.otherPack && student ? `Regular price is ${current.otherPack.product.priceString}.` : current?.otherPack && !student ? `Students pay ${current.otherPack.product.priceString}.` : 'Regular pricing is a little higher.'}`}
          chevron={false}
          last
          trailing={<NativeToggle label="I'm a college student" value={student} onChange={(v) => { feedback('select'); setNotice(null); setSettings({ isStudent: v }); }} />}
        />
      </View>

      {days && selected && current ? (
        <View style={{ gap: 10 }}>
          {[
            { when: 'Today', what: 'Everything in Plus, free.', color: c.added },
            { when: `Day ${Math.max(1, days - 2)}`, what: 'We remind you the trial is ending.', color: c.changed },
            { when: `Day ${days}`, what: `${selected.product.priceString} ${current.period.replace('/ ', 'per ')}. Cancel before and pay nothing.`, color: c.inkPrimary },
          ].map((r) => (
            <View key={r.when} style={styles.timelineRow}>
              <View style={[styles.timelineDot, { backgroundColor: r.color }]} />
              <T token="subhead" style={{ width: 54 }}>{r.when}</T>
              <T token="caption" color={c.inkSecondary} style={{ flex: 1 }}>{r.what}</T>
            </View>
          ))}
        </View>
      ) : null}

      {!loading && !unavailableReason && !offering?.availablePackages.length && !error ? (
        <T token="callout" color={c.inkSecondary}>Plans aren’t available right now. You can keep using Semli for free.</T>
      ) : null}
      {unavailableReason || error || notice ? <T token="caption" color={c.inkSecondary} accessibilityRole="alert">{unavailableReason ?? error ?? notice}</T> : null}

      <View style={{ gap: 8, alignItems: 'center' }}>
        <Press haptic="tap" accessibilityRole="button" accessibilityState={{ disabled: disabled || !selected }} disabled={disabled || !selected} onPress={() => void buyPlan()}
          style={[styles.cta, { backgroundColor: c.inkPrimary, opacity: disabled || !selected ? 0.4 : 1 }]}>
          <T token="headline" color={c.onPrimary}>{busy ? 'One moment…' : days ? 'Start free trial' : 'Get Semli Plus'}</T>
        </Press>
        <T token="caption" color={c.inkSecondary} style={styles.center}>
          {selected && current ? `${days ? `${days}-day free trial, then ` : ''}${selected.product.priceString} ${current.period.replace('/ ', 'per ')}. Auto-renews. Cancel any time.` : 'Prices are shown before you confirm.'}
        </T>
        {onContinueFree ? (
          <TextButton tone="muted" onPress={onContinueFree} label={`Continue free${freeImportsLeft !== undefined ? ` · ${freeImportsLeft} ${freeImportsLeft === 1 ? 'import' : 'imports'} left this month` : ' · 3 imports a month'}`} />
        ) : null}
        {!unavailableReason && (error || !offering) ? <TextButton tone="muted" label="Refresh plans" onPress={() => { setNotice(null); void refresh(); }} /> : null}
        <Links onRestore={() => void restorePlan()} onLegal={legal} disabled={disabled} />
        {usingTestStore && !unavailableReason ? <T token="caption" color={c.inkSecondary} style={styles.center}>Test purchases don’t charge you.</T> : null}
      </View>
    </View>
  );
}

function Links({ onRestore, onLegal, disabled }: { onRestore: () => void; onLegal: (url: string) => void; disabled: boolean }) {
  const { c } = useTheme();
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
  cta: { alignSelf: 'stretch', height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth },
  radio: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 7, height: 7, borderRadius: 4 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timelineDot: { width: 8, height: 8, borderRadius: 4 },
  center: { textAlign: 'center' },
  links: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  link: { minHeight: 36, paddingHorizontal: 12, justifyContent: 'center' },
});
