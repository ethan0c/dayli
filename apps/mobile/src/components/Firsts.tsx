import { diffDays, formatRange, monthDay, movableOverlap, weekdayShort, type MovableOverlap } from '@dayli/core';
import type { Item } from '@dayli/schema';
import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { GroupLabel, TextButton } from '@/components/Controls';
import { T } from '@/components/Text';
import { profile, track } from '@/lib/analytics';
import { enter, exit, layout } from '@/lib/motion';
import { usePurchases } from '@/providers/PurchasesProvider';
import { useStore, type FirstKind } from '@/store';
import { useTheme } from '@/theme';

/**
 * Firsts: things Semli explains once, the first time they happen in a person's own plan, in
 * place of a tour. Each note names the real thing, says what Semli does about it, and opens
 * the screen where that already works. Seen once (either button), it never returns.
 */
export function FirstNote({ kind, label, body, detail, action, onAction, dismiss = 'Got it' }: {
  kind: FirstKind; label: string; body: string; detail: string; action: string; onAction: () => void; dismiss?: string;
}) {
  const { c } = useTheme();
  const { isPro } = usePurchases();
  const setSettings = useStore((s) => s.setSettings);
  useEffect(() => { track('first_note', { kind, action: 'shown' }); }, [kind]);
  const seen = (action: 'opened' | 'dismissed') => {
    track('first_note', { kind, action, pro: isPro });
    setSettings({ firsts: { ...useStore.getState().settings.firsts, [kind]: true } });
  };
  return (
    <View style={styles.root} accessibilityRole="summary">
      <GroupLabel>{label}</GroupLabel>
      <T token="body">{body}</T>
      <T token="callout" color={c.inkSecondary}>{detail}</T>
      <View style={styles.actions}>
        <TextButton label={action} onPress={() => { seen('opened'); onAction(); }} />
        <TextButton label={dismiss} tone="muted" onPress={() => seen('dismissed')} />
      </View>
    </View>
  );
}

const when = (date: string, today: string) => date === today ? 'today' : diffDays(today, date) === 1 ? 'tomorrow' : `${weekdayShort(date)}, ${monthDay(date)}`;

/** The first overlap Semli could resolve: it keeps the plan that can't move and moves the one that can. */
export function FirstOverlap({ overlap, today }: { overlap: MovableOverlap; today: string }) {
  const { isPro } = usePurchases();
  const { flexible, other } = overlap;
  const time = flexible.start && flexible.end ? ` (${formatRange(flexible.start, flexible.end)})` : '';
  return (
    <FirstNote kind="overlap" label="Your first overlap"
      body={`${flexible.title} overlaps ${other.title} ${when(flexible.date, today)}${time}.`}
      detail={isPro
        ? `Semli marks overlaps red as plans come in, and keeps the one that can’t move. Open this one for a free time for ${flexible.title}; ${other.title} stays where it is.`
        : `Semli marks overlaps red as plans come in, and keeps the one that can’t move. With Plus, it finds a free time for ${flexible.title} and moves it in one tap; ${other.title} stays where it is.`}
      action="See it" onAction={() => router.push(`/item/${flexible.id}`)} />
  );
}

/** The first deadline inside two days: where the Urgent switch is, and what it does. */
export function FirstUrgent({ item, today }: { item: Item; today: string }) {
  const { isPro } = usePurchases();
  return (
    <FirstNote kind="urgent" label="Due soon"
      body={`${item.title} is due ${when(item.date, today)}.`}
      detail={isPro
        ? 'Standard reminders are on their way. For the ones you can’t miss, open it and switch on Urgent: it rings like an alarm, even on silent.'
        : 'Standard reminders are free and on their way. With Plus, an urgent item rings like an alarm, even on silent. Open it and switch on Urgent.'}
      action="Open it" onAction={() => router.push(`/item/${item.id}`)} />
  );
}

/** Picked Canvas in setup but never connected it. Once, not every morning. */
export function FirstCanvas() {
  return (
    <FirstNote kind="canvas" label="Canvas"
      body="Your assignments live in Canvas."
      detail="Connect it once and due dates come in on their own, and move when a professor changes them. It takes the calendar link from Canvas, not your password."
      action="Connect Canvas" onAction={() => router.push('/settings/canvas')} dismiss="Not now" />
  );
}

/** The first busy day on the list view: the toggle to the day by the hour is an icon, so say it once. */
export function FirstHours({ timed }: { timed: number }) {
  const setSettings = useStore((s) => s.setSettings);
  return (
    <FirstNote kind="hours" label="A full day"
      body={`${timed} things with times today.`}
      detail="The button at the top shows the day by the hour instead, where gaps and overlaps are easier to see. Switch back any time."
      action="Show the hours" onAction={() => { setSettings({ todayView: 'hours' }); track('today_view_changed', { view: 'hours', timed, source: 'first' }); profile({ today_view: 'hours', today_view_source: 'first' }); }} />
  );
}

/** At most one note on Today at a time: the overlap first, then a close deadline, then Canvas, then the hour view. */
export function TodayFirst({ items, now, timedToday, style }: { items: Item[]; now: { date: string; time: string }; timedToday: number; style?: StyleProp<ViewStyle> }) {
  const firsts = useStore((s) => s.settings.firsts);
  const todayView = useStore((s) => s.settings.todayView);
  const lms = useStore((s) => s.settings.lms);
  const canvasConnected = useStore((s) => !!s.settings.canvas.feedUrl);
  const overlap = useMemo(() => (firsts.overlap ? null : movableOverlap(items, now)), [firsts.overlap, items, now]);
  const deadline = useMemo(() => firsts.urgent ? null : items
    .filter((item) => item.isDeadline && !item.done && !item.urgent && item.date >= now.date && diffDays(now.date, item.date) <= 2)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.start ?? '').localeCompare(b.start ?? ''))[0] ?? null, [firsts.urgent, items, now.date]);
  const note = overlap ? <FirstOverlap overlap={overlap} today={now.date} />
    : deadline ? <FirstUrgent item={deadline} today={now.date} />
    : !firsts.canvas && lms === 'canvas' && !canvasConnected ? <FirstCanvas />
    : !firsts.hours && todayView === 'list' && timedToday >= 3 ? <FirstHours timed={timedToday} />
    : null;
  if (!note) return null;
  return <Animated.View layout={layout} entering={enter.fade} exiting={exit.fade} style={style}>{note}</Animated.View>;
}

const styles = StyleSheet.create({
  root: { gap: 6 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingTop: 4 },
});
