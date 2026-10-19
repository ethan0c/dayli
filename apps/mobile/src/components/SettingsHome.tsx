import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { StatusPill, TextButton } from '@/components/Controls';
import { Skeleton } from '@/components/Skeleton';
import { Group, Row, ToggleRow } from '@/components/Settings';
import { T } from '@/components/Text';
import { TabHeader } from '@/components/TabHeader';
import { feedback } from '@/lib/feedback';
import { LINKS, SUPPORT_EMAIL, openLink } from '@/lib/links';
import { profileFor } from '@/lib/majors';
import { useNow } from '@/lib/now';
import { FREE_IMPORTS_PER_MONTH } from '@/lib/plans';
import { PRO_ENTITLEMENT, customerCenterEnabled } from '@/lib/revenuecat';
import { usePurchases } from '@/providers/PurchasesProvider';
import { useStore } from '@/store';
import { NAV_INSET, SCREEN_GUTTER, useTheme } from '@/theme';

const APPEARANCE_LABEL = { system: 'Match iPhone', light: 'Light', dark: 'Dark' } as const;

/** Profile and preferences, shared by the You tab and /settings. */
export function SettingsHome({ inTab = false }: { inTab?: boolean }) {
  const { c } = useTheme();
  const now = useNow();
  const { isPro, customerInfo, loading, busy, manageSubscription } = usePurchases();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const usage = useStore((s) => s.usage);
  const month = new Date().toISOString().slice(0, 7);
  const used = usage.month === month ? usage.imports : 0;
  const [linkNote, setLinkNote] = useState<string | null>(null);
  const [openedAt] = useState(() => Date.now());
  const open = async (url: string, fallback: string) => {
    feedback('tap');
    setLinkNote((await openLink(url)) ? null : `We couldn't open that. ${fallback}`);
  };
  const entitlement = customerInfo?.entitlements.active[PRO_ENTITLEMENT];
  const trialEnds = settings.trial?.endsAt ? Math.max(0, Math.ceil((new Date(settings.trial.endsAt).getTime() - openedAt) / 86_400_000)) : null;
  const plan = isPro
    ? trialEnds !== null && trialEnds > 0 && entitlement?.periodType === 'TRIAL'
      ? { label: `Plus · Trial, ${trialEnds} ${trialEnds === 1 ? 'day' : 'days'} left`, tone: 'green' as const }
      : { label: 'Plus', tone: 'green' as const }
    : { label: `Free · ${used} of ${FREE_IMPORTS_PER_MONTH} imports`, tone: 'grey' as const };

  return (
    <ScrollView style={{ backgroundColor: c.canvas }} contentContainerStyle={{ paddingBottom: inTab ? NAV_INSET : 48 }} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior={inTab ? 'never' : 'automatic'}>
      <TabHeader date={now.date} label="Profile and preferences" title="You" inset={inTab}
        details={<View style={{ alignSelf: 'flex-start' }}>{loading && !customerInfo ? <Skeleton width={132} height={28} round={14} /> : <StatusPill label={plan.label} tone={plan.tone} tabular={false} />}</View>} />
      <View style={styles.body}>

        <Group title="Profile">
          <Row label="Name" value={settings.name.trim() || 'Add your name'} onPress={() => router.push('/settings/name')} />
          {settings.isStudent ? <Row label="Studying" value={profileFor(settings.major, true).label} onPress={() => router.push('/settings/major')} last /> : null}
        </Group>

        <Group title="Preferences">
          <Row label="Reminders" value={settings.reminders.enabled ? (settings.reminders.briefing ? 'On, with briefing' : 'On') : 'Off'} onPress={() => router.push('/settings/reminders')} />
          <Row label="Appearance" value={APPEARANCE_LABEL[settings.appearance]} onPress={() => router.push('/settings/appearance')} />
          <ToggleRow label="Sounds" value={settings.sounds} onChange={(sounds) => { setSettings({ sounds }); feedback('select'); }} />
          <ToggleRow label="Haptics" value={settings.haptics} onChange={(haptics) => { setSettings({ haptics }); feedback('tap'); }} last />
        </Group>

        <Group title="Account" footer="Planning as a guest. Your schedule is stored on this phone.">
          <Row label="Account settings" value="Guest" onPress={() => router.push('/account?section=manage')} />
          <Row label="Log in or sign up" onPress={() => router.push('/auth')} />
          <Row label="Share your schedule" value="Preview" onPress={() => router.push('/share-schedule')} last />
        </Group>

        <Group label={<T token="overline" color={c.inkSecondary} style={styles.groupLabel}>Semli <T token="overline" color={c.accentInk}>Plus</T></T>}>
          <Row label="Your plan" value={isPro ? (entitlement?.expirationDate ? `${entitlement.willRenew ? 'Renews' : 'Until'} ${new Date(entitlement.expirationDate).toLocaleDateString()}` : 'Active') : 'Free'} onPress={() => router.push('/settings/plan')} />
          <Row label="Manage subscription" value={busy ? 'Opening…' : undefined} last onPress={busy ? undefined : () => {
            if (customerCenterEnabled || customerInfo?.managementURL) void manageSubscription().catch(() => router.push('/settings/plan'));
            else router.push('/settings/plan');
          }} />
        </Group>

        <Group title="Your stuff" footer={linkNote ?? undefined}>
          <Row label="Your data" value="On this phone" onPress={() => router.push('/settings/data')} />
          <Row label="Help and feedback" value={SUPPORT_EMAIL} onPress={() => void open(LINKS.support, 'Email us at ' + SUPPORT_EMAIL + '.')} />
          <Row label="Rate Semli" onPress={() => void open(LINKS.review, 'Open the App Store to leave a rating.')} last={!__DEV__} />
          {__DEV__ ? <Row label="Semli server" value={settings.apiUrl.replace(/^https?:\/\//, '')} onPress={() => router.push('/settings/server')} last /> : null}
        </Group>

        <View style={styles.about}>
          <View style={styles.markRow}>
            <View style={[styles.mark, { backgroundColor: c.inkPrimary }]}><View style={[styles.markBig, { backgroundColor: c.onPrimary }]} /><View style={[styles.markSmall, { backgroundColor: c.accent }]} /></View>
            <T token="caption" color={c.inkSecondary} tabular>Semli {Constants.expoConfig?.version ?? ''}</T>
          </View>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <TextButton label="Privacy" tone="muted" onPress={() => void open(LINKS.privacy, 'Read it at semli.app/privacy.')} />
            <TextButton label="Terms" tone="muted" onPress={() => void open(LINKS.terms, 'Read it at semli.app/terms.')} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 24, gap: 22 },
  groupLabel: { paddingBottom: 2 },
  about: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  markRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 24, height: 24, borderRadius: 6 },
  markBig: { position: 'absolute', left: 5, bottom: 4, width: 11, height: 11, borderRadius: 6 },
  markSmall: { position: 'absolute', right: 5, top: 5, width: 5, height: 5, borderRadius: 3 },
});
