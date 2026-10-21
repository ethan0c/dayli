import Constants from 'expo-constants';
import { fullDate, localParts } from '@dayli/core';
import { appIconColors } from '@dayli/tokens';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ListRow, StatusPill, TextButton } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { Skeleton } from '@/components/Skeleton';
import { Group, Row, ToggleRow } from '@/components/Settings';
import { T } from '@/components/Text';
import { TabHeader } from '@/components/TabHeader';
import { ACCOUNTS_ENABLED, SHARING_ENABLED } from '@/lib/auth';
import { accountOf, useSession } from '@/lib/supabase';
import { feedback } from '@/lib/feedback';
import { LINKS, SUPPORT_EMAIL, openLink } from '@/lib/links';
import { deviceRegion, regionName } from '@/lib/locale';
import { profileFor } from '@/lib/majors';
import { useCanDo } from '@/lib/can-do';
import { freeImportAllowance } from '@/lib/plans';
import { PLUS_ENTITLEMENT } from '@/lib/revenuecat';
import { usePurchases } from '@/providers/PurchasesProvider';
import { useStore } from '@/store';
import { NAV_INSET, SCREEN_GUTTER, useTheme } from '@/theme';

const APPEARANCE_LABEL = { system: 'Match iPhone', light: 'Light', dark: 'Dark' } as const;

/** Profile and preferences, shared by the You tab and /settings. */
export function SettingsHome({ inTab = false }: { inTab?: boolean }) {
  const { c } = useTheme();
  const { isPlus, customerInfo, loading } = usePurchases();
  const settings = useStore((s) => s.settings);
  const backupStatus = settings.cloud.error ? 'Backup needs attention' : settings.cloud.backedUpAt ? 'Backed up' : 'Backup pending';
  /** null for a guest. */
  const email = useSession((s) => { const account = accountOf(s.session); return account ? account.user.email ?? '' : null; });
  const setSettings = useStore((s) => s.setSettings);
  const usage = useStore((s) => s.usage);
  const allowance = freeImportAllowance(usage);
  const canDo = useCanDo();
  const [linkNote, setLinkNote] = useState<string | null>(null);
  const [openedAt] = useState(() => Date.now());
  const open = async (url: string, fallback: string) => {
    feedback('tap');
    setLinkNote((await openLink(url)) ? null : `We couldn't open that. ${fallback}`);
  };
  const entitlement = customerInfo?.entitlements.active[PLUS_ENTITLEMENT];
  const trialEnds = settings.trial?.endsAt ? Math.max(0, Math.ceil((new Date(settings.trial.endsAt).getTime() - openedAt) / 86_400_000)) : null;
  const plan = isPlus
    ? trialEnds !== null && trialEnds > 0 && entitlement?.periodType === 'TRIAL'
      ? { label: `Plus · Trial, ${trialEnds} ${trialEnds === 1 ? 'day' : 'days'} left`, tone: 'green' as const }
      : { label: 'Plus', tone: 'green' as const }
    : { label: `Free · ${allowance.used} of ${allowance.allowed} imports${allowance.toStart ? ' to start' : ''}`, tone: 'grey' as const };

  return (
    <ScrollView style={{ backgroundColor: c.canvas }} contentContainerStyle={{ paddingBottom: inTab ? NAV_INSET : 48 }} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior={inTab ? 'never' : 'automatic'}>
      <TabHeader title="You" size="title" inset={inTab}
        details={<View style={{ alignSelf: 'flex-start' }}>{loading && !customerInfo ? <Skeleton width={132} height={28} round={14} /> : <StatusPill label={plan.label} tone={plan.tone} tabular={false} />}</View>} />
      <View style={styles.body}>

        <Group title="Profile">
          <Row label="Name" icon="user" value={settings.name.trim() || 'Add your name'} onPress={() => router.push('/settings/name')} />
          {settings.isStudent ? <Row label="Studying" icon="school" value={profileFor(settings.major, true).label} onPress={() => router.push('/settings/major')} last /> : null}
        </Group>

        <Group title="Preferences">
          <Row label="Reminders" icon="bell" value={settings.reminders.enabled ? (settings.reminders.briefing ? 'On, with daily summary' : 'On') : 'Off'} onPress={() => router.push('/settings/reminders')} />
          <Row label="Canvas" icon="book" value={settings.canvas.feedUrl ? (settings.canvas.lastError ? 'Needs a look' : 'Syncing') : 'Off'} onPress={() => router.push('/settings/canvas')} />
          <Row label="Region" icon="globe" value={regionName(settings.region ?? deviceRegion())} onPress={() => router.push('/settings/region')} />
          <Row label="Appearance" icon="appearance" value={APPEARANCE_LABEL[settings.appearance]} onPress={() => router.push('/settings/appearance')} />
          <ToggleRow label="Sounds" icon="volume" value={settings.sounds} onChange={(sounds) => { setSettings({ sounds }); feedback('select'); }} />
          <ToggleRow label="Haptics" icon="vibrate" value={settings.haptics} onChange={(haptics) => { setSettings({ haptics }); feedback('tap'); }} last />
        </Group>

        {/* Two states: only on this iPhone, or backed up. The guest row is the ask to save the plan. */}
        {ACCOUNTS_ENABLED ? <Group title="Account">
          {email !== null
            ? <ListRow leading={<Icon name="lock" size={20} color={c.inkPrimary} />} title={email || 'Your account'} sub={`Account settings · ${backupStatus}`} onPress={() => router.push('/account')} last={!SHARING_ENABLED} />
            : <ListRow leading={<Icon name="lock" size={20} color={c.inkPrimary} />} title="Back up your plan" sub="Create a free account to back up your plan" onPress={() => router.push('/account')} last={!SHARING_ENABLED} />}
          {SHARING_ENABLED ? <Row label="Share your schedule" icon="share" value="Preview" onPress={() => router.push('/share-schedule')} last /> : null}
        </Group> : null}

        <Group label={<T token="overline" color={c.inkSecondary} style={styles.groupLabel}>Semli <T token="overline" color={c.accentInk}>Plus</T></T>}>
          <Row label="Your plan" icon="sparkle" value={isPlus ? (entitlement?.expirationDate ? `${entitlement.willRenew ? 'Renews' : 'Until'} ${fullDate(localParts(new Date(entitlement.expirationDate)).date)}` : 'Active') : 'Free'} onPress={() => router.push('/settings/plan')} last />
        </Group>

        <Group title="Your stuff" footer={linkNote ?? undefined}>
          <Row label="What Semli can do" icon="list" value={`${canDo.filter((t) => t.done).length} of ${canDo.length} tried`} onPress={() => router.push('/settings/can-do')} />
          <Row label="Your data" icon="file" value={email !== null ? backupStatus : 'On this phone'} onPress={() => router.push('/settings/data')} />
          <Row label="Help and feedback" icon="mail" value={SUPPORT_EMAIL} onPress={() => void open(LINKS.support, 'Email us at ' + SUPPORT_EMAIL + '.')} />
          <Row label="Rate Semli" icon="star" onPress={() => void open(LINKS.review, 'Open the App Store to leave a rating.')} last />
        </Group>

        {__DEV__ ? <Group title="Development">
          <Row label="Plan diagnostics" icon="search" onPress={() => router.push('/settings/plan-status')} />
          <Row label="Semli server" icon="chart" value={settings.apiUrl.replace(/^https?:\/\//, '')} onPress={() => router.push('/settings/server')} last />
        </Group> : null}

        <View style={styles.about}>
          <View style={styles.markRow}>
            <View style={[styles.mark, { backgroundColor: appIconColors.background }]}><View style={[styles.markBig, { backgroundColor: appIconColors.foreground }]} /><View style={[styles.markSmall, { backgroundColor: appIconColors.accent }]} /></View>
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
