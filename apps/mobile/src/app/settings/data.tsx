import { diffDays, formatTime, localParts, monthDay, relativeDay } from '@dayli/core';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { ListRow, StatusPill, TextButton } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { Group, Row } from '@/components/Settings';
import { T } from '@/components/Text';
import { backUpNow } from '@/lib/cloud';
import { buildBackup, buildIcs, shareText } from '@/lib/export';
import { friendlyError } from '@/lib/errors';
import { feedback } from '@/lib/feedback';
import { enter, exit, layout } from '@/lib/motion';
import { useNow } from '@/lib/now';
import { accountOf, useSession } from '@/lib/supabase';
import { useCourseList, useItemList, useScheduleList, useStore, type Batch } from '@/store';
import { SCREEN_GUTTER, useTheme } from '@/theme';

const RECENT = 3;

/** "from a screenshot", "from a photo", "from a PDF", "from your message". */
function fromSource(source: string | null | undefined): string | null {
  if (!source) return null;
  const s = source.toLowerCase();
  if (s === 'screenshot') return 'from a screenshot';
  if (s === 'photo') return 'from a photo';
  if (s === 'message') return 'from your message';
  if (s === 'voice') return 'from your voice note';
  if (s.endsWith('.pdf')) return 'from a PDF';
  return `from ${source}`;
}

export default function DataScreen() {
  const { c } = useTheme();
  const now = useNow();
  const items = useItemList();
  const courses = useCourseList();
  const schedules = useScheduleList();
  const batches = useStore((s) => s.batches);
  const undoBatch = useStore((s) => s.undoBatch);
  const clearAll = useStore((s) => s.clearAll);
  const setSettings = useStore((s) => s.setSettings);
  const canvasConnected = useStore((s) => !!s.settings.canvas.feedUrl);
  // Signed in, the account keeps the setup answers and only the plan is cleared; a guest starts over.
  const signedIn = useSession((s) => !!accountOf(s.session));
  const [confirm, setConfirm] = useState(false);
  const [allChanges, setAllChanges] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const jobs = useMemo(() => new Set(items.map((it) => it.employer?.trim().toLowerCase()).filter(Boolean)).size, [items]);
  const since = useMemo(() => items.map((it) => it.createdAt.slice(0, 10)).sort()[0], [items]);
  const summary = [
    `${courses.length} ${courses.length === 1 ? 'course' : 'courses'}`,
    `${jobs} ${jobs === 1 ? 'job' : 'jobs'}`,
    since ? `since ${monthDay(since)}` : null,
  ].filter(Boolean).join(' · ');

  const share = async (name: string, text: string, mime: string) => {
    feedback('tap');
    setExportError(null);
    try {
      const ok = await shareText(name, text, mime);
      if (!ok) setExportError('Sharing isn’t available on this device. Try again after updating Semli.');
    } catch (error) {
      setExportError(friendlyError(error, 'We couldn’t export your plan. Check that your device has free storage, then try again.', 'export.share'));
    }
  };
  const exportPlan = () => share('semli-plan.json', buildBackup({ items, courses, schedules, exportedAt: new Date().toISOString() }), 'application/json');
  const clear = () => {
    clearAll(signedIn ? 'plan' : 'everything');
    setConfirm(false);
    if (signedIn) backUpNow();
    else router.dismissTo('/');
  };
  const clearWarning = signedIn
    ? `Clear your plan? Every item, class, shift and break you added is erased here and from your account’s backup. Your answers from setup stay.${canvasConnected ? ' Canvas stays connected, so its due dates come back on the next sync.' : ''} This cannot be undone.`
    : 'Clear everything? Your plan and your answers from setup, like your name and what you study, are erased and Semli starts over from the welcome screen. As a guest there’s no backup, so this cannot be undone.';
  const exportCalendar = () => share('semli.ics', buildIcs(items, courses), 'text/calendar');

  const whenLabel = (b: Batch) => {
    const at = localParts(new Date(b.createdAt));
    const day = Math.abs(diffDays(at.date, now.date)) <= 1 ? relativeDay(now.date, at.date) : monthDay(at.date);
    return [`${day}, ${formatTime(at.time)}`, fromSource(b.source) ?? (b.changes.length > 1 ? `${b.changes.length} changes` : null)].filter(Boolean).join(' · ');
  };
  const shown = allChanges ? batches : batches.slice(0, RECENT);
  const rest = batches.length - RECENT;

  const batchRow = (b: Batch, last: boolean) => (
    <Animated.View key={b.id} layout={layout} entering={enter.fade} exiting={exit.fade}>
      <ListRow title={b.label} sub={whenLabel(b)} last={last} chevron={false} onPress={() => router.push(`/import/${b.id}`)}
        accessibilityLabel={`${b.label}, ${whenLabel(b)}${b.undone ? ', undone' : ''}`}
        trailing={b.undone
          ? <StatusPill label="Undone" />
          : b.changes.length > 0 ? <TextButton label="Undo" haptic="undo" onPress={() => undoBatch(b.id)} accessibilityLabel={`Undo ${b.label}`} /> : null} />
    </Animated.View>
  );

  return (
    <ScrollView contentContainerStyle={styles.body} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.top}>
        <T token="callout" color={c.inkSecondary}>{signedIn ? 'On this phone, backed up to your account' : 'On this phone, nowhere else'}</T>
        <T token="displayXl" tabular>{`${items.length} ${items.length === 1 ? 'thing' : 'things'}`}</T>
        <T token="body" style={styles.line}>{summary}</T>
      </View>

      <Group title="Keep it safe" footer={exportError ?? undefined}>
        <ListRow title="Export my plan" sub="A file you can AirDrop, save, or bring to a new phone" onPress={() => void exportPlan()} />
        <ListRow title="Add to Calendar" sub="Every event into Apple or Google Calendar, once" onPress={() => void exportCalendar()} last />
      </Group>

      <Group title="Recent changes">
        {batches.length === 0 ? (
          <View style={styles.empty}>
            <T token="callout" color={c.inkSecondary}>Your imports and edits will appear here. You can undo them any time.</T>
          </View>
        ) : (
          <Animated.View layout={layout}>
            {shown.map((b, i) => batchRow(b, i === shown.length - 1))}
            {rest > 0 ? (
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: allChanges }} onPress={() => { feedback('select'); setAllChanges((o) => !o); }} style={styles.disclosure}>
                <T token="caption" color={c.inkSecondary}>{allChanges ? 'Fewer changes' : `All ${batches.length} changes`}</T>
                <Icon name={allChanges ? 'chevronLeft' : 'chevronRight'} size={16} color={c.inkSecondary} />
              </Pressable>
            ) : null}
          </Animated.View>
        )}
      </Group>

      <Group title="Start again" footer={signedIn ? 'Your account backs up this phone, so clearing here clears the backup too.' : 'Nothing here leaves the phone unless you export it.'}>
        <Row label="Replay the intro" value="Keeps everything" onPress={() => { feedback('tap'); setSettings({ onboarded: false, onboardingImportDone: false }); router.dismissTo('/'); }} />
        {confirm ? (
          <Animated.View entering={enter.drop} exiting={exit.fade} style={styles.confirm} accessibilityRole="alert">
            <T token="callout" color={c.inkSecondary} style={{ flexBasis: '100%' }}>{clearWarning}</T>
            <TextButton label="Export first" onPress={() => void exportPlan()} />
            <TextButton label="Keep" tone="muted" onPress={() => setConfirm(false)} />
            <TextButton label="Clear" tone="danger" haptic="warning" onPress={clear} />
          </Animated.View>
        ) : (
          <Row label={signedIn ? 'Clear my plan' : 'Clear everything'} destructive onPress={() => { feedback('tap'); setConfirm(true); }} last />
        )}
      </Group>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 8, paddingBottom: 48, gap: 22 },
  top: { gap: 2 },
  line: { fontSize: 18, lineHeight: 26, letterSpacing: -0.2, paddingTop: 6 },
  empty: { paddingVertical: 16 },
  disclosure: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  confirm: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, minHeight: 52, paddingVertical: 4 },
});
