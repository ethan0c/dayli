import { addDays, conflictIds, deadlineReason, deadlineWindow, diffDays, findConflicts, formatRange, formatTime, featuredCommitment, monthDay, nowSummary, overdueTasks, pendingDates, relativeDay, startTodaySuggestions, todayItems, tomorrowSummary, weekdayLong } from '@dayli/core';
import type { Item } from '@dayli/schema';
import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ScreenHeader } from '@/components/ScreenHeader';
import { HomeCaptureCard } from '@/components/HomeCaptureCard';
import { Icon } from '@/components/Icon';
import { ItemRow } from '@/components/ItemRow';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { useNow } from '@/lib/now';
import { useItemList, useStore } from '@/store';
import { SAMPLE_SOURCE } from '@/store/sample';
import { SCREEN_GUTTER, NAV_INSET, radius, useCardSurface, useTheme } from '@/theme';

export default function TodayScreen() {
  const { c } = useTheme();
  const now = useNow();
  const items = useItemList();
  const schedules = useStore((s) => s.schedules);
  const workDates = useStore((s) => s.taskWorkDates);
  const dismissals = useStore((s) => s.suggestionDismissals);
  const toggleDone = useStore((s) => s.toggleDone);
  const planTasks = useStore((s) => s.planTasks);
  const unplanTask = useStore((s) => s.unplanTask);
  const dismissSuggestion = useStore((s) => s.dismissSuggestion);
  const setCaptureDraft = useStore((s) => s.setCaptureDraft);
  const [overdueExpanded, setOverdueExpanded] = useState(false);
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const featureSurface = useCardSurface('accent');

  const todays = useMemo(() => todayItems(items, now.date, workDates), [items, now.date, workDates]);
  const overdue = useMemo(() => overdueTasks(items, now.date, workDates), [items, now.date, workDates]);
  const suggestions = useMemo(() => startTodaySuggestions(items, now, workDates, dismissals.date === now.date ? dismissals.ids : []), [items, now, workDates, dismissals]);
  const summary = useMemo(() => nowSummary(items, now), [items, now]);
  const tomorrow = useMemo(() => tomorrowSummary(items, now, workDates), [items, now, workDates]);
  const upcoming = useMemo(() => items.filter((item) => !item.done && item.isDeadline && item.date > now.date && diffDays(now.date, item.date) <= 14
    && !suggestions.some((suggestion) => suggestion.item.id === item.id)).slice(0, 5), [items, now.date, suggestions]);
  // Include yesterday's events so overnight shifts don't disappear at midnight.
  const weekAhead = useMemo(() => items.filter((item) => item.date >= addDays(now.date, -1) && diffDays(now.date, item.date) <= 7), [items, now.date]);
  const conflicts = useMemo(() => findConflicts(weekAhead).filter((conflict) => {
    const a = items.find((item) => item.id === conflict.a);
    const b = items.find((item) => item.id === conflict.b);
    return (a?.date ?? '') >= now.date || (b?.date ?? '') >= now.date;
  }), [weekAhead, items, now.date]);
  const conflictSet = useMemo(() => conflictIds(weekAhead), [weekAhead]);
  const byId = useMemo(() => Object.fromEntries(items.map((item) => [item.id, item])) as Record<string, Item>, [items]);
  const nextWeekPending = schedules.length > 0 && pendingDates(schedules, addDays(now.date, 1), addDays(now.date, 7)).length > 0;
  const isSample = items.some((item) => item.sourceId === SAMPLE_SOURCE);
  const tightDeadlines = items.filter((item) => !item.done && item.isDeadline && item.start
    && (item.date > now.date || item.date === now.date && item.start > now.time)
    && diffDays(now.date, item.date) <= 7 && !suggestions.some((suggestion) => suggestion.item.id === item.id))
    .map((item) => ({ item, window: deadlineWindow(items, item, now) }))
    .filter(({ window }) => !window.hasUnknownTimes && window.unbookedHours < 4);
  const hasWarnings = conflicts.length > 0 || tightDeadlines.length > 0;
  const featuredState = useMemo(() => featuredCommitment(items, now), [items, now]);
  const featured = featuredState?.item;
  const ongoing = featuredState?.ongoing ?? false;
  const completed = todays.filter((item) => item.done);
  const openItems = todays.filter((item) => !item.done && item.id !== featured?.id);
  const eventCount = todays.filter((item) => !item.done && item.kind === 'event').length;
  const taskCount = todays.filter((item) => !item.done && item.kind === 'task').length;

  function openCapture(text: string, source?: 'image' | 'file') {
    setCaptureDraft(text);
    feedback('tap');
    router.push({ pathname: '/capture', params: source ? { source } : {} });
  }

  function workOnToday(ids: string[]) {
    planTasks(ids, now.date);
    feedback('select');
  }

  return (
    <ScrollView style={{ backgroundColor: c.canvas }} contentContainerStyle={{ paddingBottom: NAV_INSET }} contentInsetAdjustmentBehavior="never" keyboardShouldPersistTaps="handled">
      <ScreenHeader title={`Your ${weekdayLong(now.date)}.`} eyebrow={`${weekdayLong(now.date)}, ${monthDay(now.date)}`} subtitle={`${eventCount} ${eventCount === 1 ? 'event' : 'events'} · ${taskCount} ${taskCount === 1 ? 'to-do' : 'to-dos'}`} safeTop />

      {isSample ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/settings/data')} style={styles.note}>
          <Icon name="sparkle" size={16} color={c.inkSecondary} />
          <T token="caption" color={c.inkSecondary} style={{ flex: 1 }}>Sample week · Manage in Your data</T>
        </Pressable>
      ) : null}

      {hasWarnings ? (
        <Section title="Heads up">
          {conflicts.slice(0, 2).map((conflict) => (
            <Pressable key={`${conflict.a}-${conflict.b}`} accessibilityRole="button" onPress={() => router.push(`/item/${conflict.a}`)} style={[styles.card, { backgroundColor: c.conflictBg }]}>
              <Icon name="alert" size={18} color={c.conflict} />
              <T token="callout" style={{ flex: 1 }}>{byId[conflict.a]?.title} overlaps {byId[conflict.b]?.title} on {monthDay(byId[conflict.a]?.date ?? now.date)}.</T>
            </Pressable>
          ))}
          {tightDeadlines.slice(0, Math.max(0, 2 - conflicts.length)).map(({ item, window }) => (
            <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push(`/item/${item.id}`)} style={[styles.card, { backgroundColor: c.accentSoft }]}>
              <Icon name="sparkle" size={18} color={c.accentInk} />
              <T token="callout" style={{ flex: 1 }}>About {window.unbookedHours} unbooked hours in your calendar before {item.title}. Estimate uses 7 am–11 pm in the three days before it.</T>
            </Pressable>
          ))}
        </Section>
      ) : null}

      {featured ? <View style={styles.featureWrap}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${ongoing ? 'Now' : 'Next'}: ${featured.title}, ${featured.start ? formatTime(featured.start) : ''}`} onPress={() => router.push(`/item/${featured.id}`)} style={({ pressed }) => [styles.feature, featureSurface, { opacity: pressed ? 0.85 : 1 }]}>
          <View style={styles.featureTop}>
            <T token="subhead" color={c.accentInk}>{ongoing ? `Now${featured.end ? ` · until ${formatTime(featured.end)}` : ''}` : `Next${featured.start ? ` · ${featured.end ? formatRange(featured.start, featured.end) : formatTime(featured.start)}` : ''}`}</T>
            <Icon name="chevronRight" size={17} color={c.accentInk} />
          </View>
          <T token="title">{featured.title}</T>
          <T token="caption" color={c.inkSecondary}>{[featured.employer, featured.category === 'school' ? 'Coursework' : featured.category === 'work' ? 'Work' : 'Personal'].filter(Boolean).join(' · ')}</T>
          {conflictSet.has(featured.id) ? <T token="caption" color={c.conflict}>Schedule conflict · tap to review</T> : null}
        </Pressable>
      </View> : todays.length ? <View style={styles.head}><T token="callout" color={c.inkSecondary}>{summary}</T></View> : null}

      <Section title="On your list">
        {!todays.length ? <HomeCaptureCard onCapture={openCapture} /> : openItems.map((item) => {
          const planned = item.date !== now.date && workDates[item.id] === now.date;
          return <View key={item.id}>
            <ItemRow item={item} planned={planned} conflict={conflictSet.has(item.id)} onPress={() => router.push(`/item/${item.id}`)} onToggle={() => {
              feedback(item.done ? 'uncomplete' : 'complete');
              toggleDone(item.id);
            }} />
            {planned ? <View style={styles.plannedNote}>
              <T token="caption" color={c.inkSecondary} style={{ flex: 1 }}>{item.isDeadline ? 'Due' : 'Original date'} {monthDay(item.date)} · working on it today</T>
              <TextAction label="Undo" accessibilityLabel={`Remove ${item.title} from today’s work plan`} muted onPress={() => unplanTask(item.id)} />
            </View> : null}
          </View>;
        })}
        {todays.length > 0 && openItems.length === 0 ? <T token="callout" color={c.inkSecondary}>{featured ? 'Your next commitment is above.' : 'Everything on your list is done.'}</T> : null}
        {completed.length ? <>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: completedExpanded }} onPress={() => setCompletedExpanded((open) => !open)} style={styles.disclosure}>
            <T token="caption" color={c.inkSecondary}>Completed · {completed.length}</T><Icon name={completedExpanded ? 'chevronLeft' : 'chevronRight'} size={16} color={c.inkSecondary} />
          </Pressable>
          {completedExpanded ? completed.map((item) => <ItemRow key={item.id} item={item} onPress={() => router.push(`/item/${item.id}`)} onToggle={() => { feedback('uncomplete'); toggleDone(item.id); }} />) : null}
        </> : null}
      </Section>

      {overdue.length ? (
        <View style={styles.section}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Still open, ${overdue.length} tasks`} accessibilityState={{ expanded: overdueExpanded }} onPress={() => setOverdueExpanded((open) => !open)} style={styles.disclosure}>
            <T token="overline" color={c.inkSecondary}>Still open · {overdue.length}</T>
            <T token="caption" color={c.inkSecondary}>{overdueExpanded ? 'Hide' : 'Show'}</T>
          </Pressable>
          {overdueExpanded ? (
            <>
              {overdue.map((item) => (
                <View key={item.id} style={[styles.overdue, { borderBottomColor: c.line }]}>
                  <Pressable accessibilityRole="button" onPress={() => router.push(`/item/${item.id}`)} style={{ flex: 1, gap: 3 }}>
                    <T>{item.title}</T><T token="caption" color={c.inkSecondary}>{item.isDeadline ? 'Due' : 'Planned for'} {monthDay(item.date)}</T>
                  </Pressable>
                  <TextAction label="Work on today" accessibilityLabel={`Work on ${item.title} today without changing its date`} onPress={() => workOnToday([item.id])} />
                </View>
              ))}
              {overdue.length > 1 ? <TextAction label="Bring all into today" onPress={() => workOnToday(overdue.map((item) => item.id))} /> : null}
              <T token="caption" color={c.inkSecondary}>Their original dates stay the same.</T>
            </>
          ) : null}
        </View>
      ) : null}

      {suggestions.length ? (
        <DisclosureSection title={`Start today · ${suggestions.length}`}>
          {suggestions.map(({ item, reason }) => (
            <View key={item.id} style={[styles.suggestion, { backgroundColor: c.accentSoft }]}>
              <Pressable accessibilityRole="button" onPress={() => router.push(`/item/${item.id}`)} style={styles.suggestionTitle}>
                <Icon name={item.icon} size={18} color={c.accentInk} />
                <View style={{ flex: 1, gap: 4 }}>
                  <T token="headline">{item.kind === 'event' ? `Prepare for ${item.title}` : item.title}</T>
                  <T token="caption" color={c.inkSecondary}>{reason}</T>
                </View>
                <Icon name="chevronRight" size={16} color={c.inkSecondary} />
              </Pressable>
              <View style={styles.suggestionActions}>
                {item.kind === 'task' ? <TextAction label="Work on today" onPress={() => workOnToday([item.id])} /> : null}
                <TextAction label="Not today" muted onPress={() => { dismissSuggestion(item.id, now.date); feedback('select'); }} />
              </View>
            </View>
          ))}
          <T token="caption" color={c.inkSecondary}>Calendar gaps are estimates within 7 am–11 pm in the three days before a due date. Unscheduled work isn’t included.</T>
        </DisclosureSection>
      ) : null}

      {tomorrow ? <Pressable accessibilityRole="button" onPress={() => router.push('/plan')} style={[styles.peek, { borderColor: c.line }]}>
        <Icon name="calendar" size={17} color={c.inkSecondary} />
        <T token="callout" color={c.inkSecondary} style={{ flex: 1 }}>{tomorrow}</T>
        <Icon name="chevronRight" size={16} color={c.inkSecondary} />
      </Pressable> : null}

      {upcoming.length || nextWeekPending ? (
        <Section title="Coming up">
          {upcoming.map((item) => (
            <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push(`/item/${item.id}`)} style={[styles.up, { borderBottomColor: c.line }]}>
              <Icon name={item.icon} size={18} color={c.inkPrimary} />
              <View style={{ flex: 1, gap: 3 }}>
                <T>{item.title}</T>
                {diffDays(now.date, item.date) <= 7 ? <T token="caption" color={c.inkSecondary}>{deadlineReason(items, item, now)}</T> : null}
              </View>
              <T token="subhead" color={diffDays(now.date, item.date) <= 1 ? c.conflict : c.inkSecondary}>{relativeDay(now.date, item.date)}</T>
            </Pressable>
          ))}
          {nextWeekPending ? (
            <Pressable accessibilityRole="button" onPress={() => openCapture('', 'image')} style={[styles.up, styles.pending, { borderColor: c.line }]}>
              <Icon name="work" size={18} color={c.inkSecondary} />
              <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <T color={c.inkSecondary}>{"Next week's shifts"}</T>
                <T token="caption" color={c.inkSecondary}>Not added yet</T>
              </View>
            </Pressable>
          ) : null}
        </Section>
      ) : null}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <View style={styles.section}><T token="headline" accessibilityRole="header">{title}</T>{children}</View>;
}

function DisclosureSection({ title, children }: { title: string; children: ReactNode }) {
  const { c } = useTheme();
  const [expanded, setExpanded] = useState(false);
  return <View style={styles.section}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded((open) => !open)} style={styles.disclosure}>
      <T token="subhead" color={c.inkSecondary}>{title}</T><T token="caption" color={c.inkSecondary}>{expanded ? 'Hide' : 'Show'}</T>
    </Pressable>
    {expanded ? children : null}
  </View>;
}

function TextAction({ label, onPress, muted, accessibilityLabel }: { label: string; onPress: () => void; muted?: boolean; accessibilityLabel?: string }) {
  const { c } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} onPress={onPress} style={styles.textAction}>
    <T token="subhead" color={muted ? c.inkSecondary : c.accentInk}>{label}</T>
  </Pressable>;
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 10, paddingBottom: 4, gap: 14 },
  note: { marginHorizontal: SCREEN_GUTTER, marginTop: 8, minHeight: 44, flexDirection: 'row', gap: 8, alignItems: 'center' },
  section: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 28, gap: 4 },
  up: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  featureWrap: { paddingHorizontal: SCREEN_GUTTER, marginTop: 24 },
  feature: { padding: 20, gap: 8 },
  featureTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  pending: { borderTopWidth: StyleSheet.hairlineWidth },
  card: { borderRadius: radius.card, padding: 14, gap: 10, flexDirection: 'row', alignItems: 'flex-start' },
  suggestion: { borderRadius: radius.card, paddingHorizontal: 16, paddingTop: 16 },
  suggestionTitle: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, minHeight: 44 },
  suggestionActions: { flexDirection: 'row', gap: 24, paddingLeft: 28, flexWrap: 'wrap' },
  textAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 2 },
  disclosure: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overdue: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  plannedNote: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 10 },
  peek: { marginHorizontal: SCREEN_GUTTER, marginTop: 20, paddingVertical: 14, gap: 10, flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
});
