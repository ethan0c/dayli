import { addDays, conflictIds, deadlineReason, deadlineWindow, diffDays, findConflicts, formatRange, formatTime, featuredCommitment, monthDay, overdueTasks, pendingDates, startTodaySuggestions, toMinutes, todayItems, tomorrowSummary, weekdayLong } from '@dayli/core';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GroupLabel, IconButton, ListRow, SectionTitle, TextButton } from '@/components/Controls';
import { DayBar } from '@/components/DayBar';
import { HourView } from '@/components/HourView';
import { Icon } from '@/components/Icon';
import { ItemRow } from '@/components/ItemRow';
import { PhotoHeader } from '@/components/PhotoHeader';
import { T } from '@/components/Text';
import { Ticker } from '@/components/Ticker';
import { TodayStart } from '@/components/TodayStart';
import { feedback } from '@/lib/feedback';
import { momentFor } from '@/lib/moments';
import { enter, exit, layout } from '@/lib/motion';
import { useNow } from '@/lib/now';
import { useCourseList, useScheduleList, useItemList, useStore } from '@/store';
import { SAMPLE_SOURCE } from '@/store/sample';
import { SCREEN_GUTTER, NAV_INSET, useTheme } from '@/theme';

/** "2h 14m", "14m", or "0m" for a gap in minutes. */
function countdown(mins: number): string {
  const m = Math.max(0, Math.round(mins));
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

export default function TodayScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const items = useItemList();
  const schedules = useScheduleList();
  const courses = useCourseList();
  const breaks = useStore((s) => s.settings.breaks);
  const workDates = useStore((s) => s.taskWorkDates);
  const dismissals = useStore((s) => s.suggestionDismissals);
  const toggleDone = useStore((s) => s.toggleDone);
  const removeItem = useStore((s) => s.removeItem);
  const todayView = useStore((s) => s.settings.todayView);
  const setSettings = useStore((s) => s.setSettings);
  const planTasks = useStore((s) => s.planTasks);
  const unplanTask = useStore((s) => s.unplanTask);
  const dismissSuggestion = useStore((s) => s.dismissSuggestion);
  const [overdueExpanded, setOverdueExpanded] = useState(false);
  const [completedExpanded, setCompletedExpanded] = useState(false);

  const todays = useMemo(() => todayItems(items, now.date, workDates), [items, now.date, workDates]);
  const overdue = useMemo(() => overdueTasks(items, now.date, workDates), [items, now.date, workDates]);
  const suggestions = useMemo(() => startTodaySuggestions(items, now, workDates, dismissals.date === now.date ? dismissals.ids : []), [items, now, workDates, dismissals]);
  const tomorrow = useMemo(() => tomorrowSummary(items, now, workDates), [items, now, workDates]);
  const upcoming = useMemo(() => items.filter((item) => !item.done && item.isDeadline && item.date > now.date && diffDays(now.date, item.date) <= 14
    && !suggestions.some((suggestion) => suggestion.item.id === item.id)).slice(0, 5), [items, now.date, suggestions]);
  const weekAhead = useMemo(() => items.filter((item) => item.date >= addDays(now.date, -1) && diffDays(now.date, item.date) <= 7), [items, now.date]);
  const conflictSet = useMemo(() => conflictIds(weekAhead), [weekAhead]);
  const conflictsToday = useMemo(() => findConflicts(weekAhead).filter((k) => items.find((i) => i.id === k.a)?.date === now.date).length, [weekAhead, items, now.date]);
  const nextWeekPending = schedules.length > 0 && pendingDates(schedules, addDays(now.date, 1), addDays(now.date, 7)).length > 0;
  const isSample = items.some((item) => item.sourceId === SAMPLE_SOURCE);
  const moment = useMemo(() => momentFor(items, breaks ?? [], now.date), [items, breaks, now.date]);
  const featuredState = useMemo(() => featuredCommitment(items, now), [items, now]);
  const featured = featuredState?.item;
  const ongoing = featuredState?.ongoing ?? false;
  const completed = todays.filter((item) => item.done);
  const openItems = todays.filter((item) => !item.done);
  const tightDeadlines = useMemo(() => new Map(items
    .filter((item) => !item.done && item.isDeadline && item.start && item.date > now.date && diffDays(now.date, item.date) <= 7)
    .map((item) => [item.id, deadlineWindow(items, item, now)] as const)
    .filter(([, w]) => !w.hasUnknownTimes && w.unbookedHours < 4)), [items, now]);

  // The one big number: minutes until the next commitment, or until the current one ends.
  const nowMin = toMinutes(now.time);
  let eyebrow = `${weekdayLong(now.date)}, ${monthDay(now.date)}`;
  let big: string | null = null;
  if (featured?.start) {
    if (ongoing && featured.end) {
      eyebrow += ' · ends in';
      big = countdown(toMinutes(featured.end) - nowMin + (toMinutes(featured.end) < toMinutes(featured.start) ? 1440 : 0));
    } else if (!ongoing) {
      const dayGap = diffDays(now.date, featured.date);
      eyebrow += ' · next in';
      big = countdown(toMinutes(featured.start) - nowMin + dayGap * 1440);
    } else {
      eyebrow += ' · now';
    }
  }
  const featuredWhere = featured ? [featured.employer ?? courses.find((k) => k.id === featured.courseId)?.code, featured.category === 'school' ? 'Coursework' : featured.category === 'work' ? 'Work' : 'Personal'].filter(Boolean).join(' · ') : '';

  function workOnToday(ids: string[]) {
    planTasks(ids, now.date);
    feedback('select');
  }

  function markAllDone(ids: string[]) {
    feedback('complete');
    for (const id of ids) toggleDone(id);
  }

  if (items.length === 0 && courses.length === 0 && schedules.length === 0) return (
    <ScrollView style={{ backgroundColor: c.canvas }} contentContainerStyle={{ paddingBottom: NAV_INSET }} contentInsetAdjustmentBehavior="never">
      <TodayStart date={now.date} paddingTop={insets.top + 18} />
    </ScrollView>
  );

  const nextTitle = featured ? `${featured.title}${featured.start ? ` · ${featured.end ? formatRange(featured.start, featured.end) : formatTime(featured.start)}` : ''}` : null;
  const hours = todayView === 'hours';
  const viewToggle = (
    <IconButton icon={hours ? 'list' : 'chart'} tone="grey" size={44} haptic="select"
      label={hours ? 'Show the list' : 'Show the day by the hour'}
      onPress={() => setSettings({ todayView: hours ? 'list' : 'hours' })} />
  );
  const todayDetail = `${todays.length} ${todays.length === 1 ? 'thing' : 'things'}${conflictsToday ? ` · ${conflictsToday} ${conflictsToday === 1 ? 'overlap' : 'overlaps'}` : ''}`;

  return (
    <ScrollView style={{ backgroundColor: c.canvas }} contentContainerStyle={{ paddingBottom: NAV_INSET }} contentInsetAdjustmentBehavior="never" keyboardShouldPersistTaps="handled">
      {moment ? (
        <>
          <PhotoHeader source={moment.image} height={330} to={c.canvas} />
          <View style={[styles.top, { paddingTop: 206 }]}>
            <T token="callout" color={c.inkSecondary}>{moment.lead}</T>
            <T token="displayXl" tabular>{moment.big}</T>
            <View style={styles.momentLine}>
              <T token="body">{moment.line}</T>
              {moment.action ? <TextButton label={moment.action.label} onPress={() => router.push(moment.action!.href as '/plan')} /> : null}
            </View>
          </View>
          <View style={[styles.topRow, { paddingTop: 26 }]}>
            <Pressable accessibilityRole={featured ? 'button' : undefined} disabled={!featured} onPress={() => featured && router.push(`/item/${featured.id}`)}
              style={({ pressed }) => [styles.topText, { opacity: pressed ? 0.7 : 1 }]}>
              <T token="callout" color={c.inkSecondary}>{eyebrow}</T>
              {big ? <Ticker value={big} token="displayXl" style={{ fontSize: 34, lineHeight: 40, letterSpacing: -0.9 }} accessibilityLabel={`${ongoing ? 'Ends in' : 'Next in'} ${big}`} /> : <T token="display">{featured ? 'Now' : 'Clear'}</T>}
              {nextTitle ? <T token="body" style={{ paddingTop: 2 }}>{nextTitle}</T> : <T token="callout" color={c.inkSecondary} style={{ paddingTop: 2 }}>{todays.length ? 'Nothing timed left today.' : 'Nothing scheduled today.'}</T>}
            </Pressable>
            {viewToggle}
          </View>
        </>
      ) : (
        <View style={[styles.topRow, { paddingTop: insets.top + 24 }]}>
          <Pressable accessibilityRole={featured ? 'button' : undefined} disabled={!featured} onPress={() => featured && router.push(`/item/${featured.id}`)}
            style={({ pressed }) => [styles.topText, { opacity: pressed ? 0.7 : 1 }]}>
            <T token="callout" color={c.inkSecondary}>{eyebrow}</T>
            {big ? <Ticker value={big} token="displayXl" accessibilityLabel={`${ongoing ? 'Ends in' : 'Next in'} ${big}`} /> : <T token="displayXl">{featured ? 'Now' : 'Clear'}</T>}
            {featured ? (
              <View style={{ gap: 2, paddingTop: 6 }}>
                <T token="body" style={{ fontSize: 18, lineHeight: 26 }}>{nextTitle}</T>
                {featuredWhere ? <T token="callout" color={c.inkSecondary}>{featuredWhere}</T> : null}
              </View>
            ) : (
              <T token="callout" color={c.inkSecondary} style={{ paddingTop: 6 }}>{todays.length ? 'Nothing timed left today.' : 'Nothing scheduled today.'}</T>
            )}
          </Pressable>
          {viewToggle}
        </View>
      )}

      <Animated.View layout={layout}>
        {hours ? (
          <Animated.View key="hours" entering={enter.fade} exiting={exit.fade} style={styles.hours}>
            <SectionTitle title="Today" detail={todayDetail} />
            <View style={{ paddingTop: 4 }}>
              <HourView items={todays} now={now} conflicts={conflictSet} onPress={(it) => router.push(`/item/${it.id}`)} />
            </View>
          </Animated.View>
        ) : (
          <Animated.View key="list" entering={enter.fade} exiting={exit.fade} style={[styles.bar, moment ? { paddingTop: 18 } : null]}>
            <DayBar items={todays} now={now} conflicts={conflictSet} />
          </Animated.View>
        )}
      </Animated.View>

      <Animated.View layout={layout} style={styles.section}>
        <SectionTitle title="On your list" onPress={() => router.push('/plan')} detail={conflictsToday ? `${conflictsToday} ${conflictsToday === 1 ? 'overlap' : 'overlaps'}` : undefined} />
        {openItems.map((item, i) => {
          const planned = item.date !== now.date && workDates[item.id] === now.date;
          return (
            <Animated.View key={item.id} layout={layout} entering={enter.fade} exiting={exit.fade}>
              <ItemRow item={item} today={now.date} planned={planned} conflict={conflictSet.has(item.id)} last={i === openItems.length - 1 && !completed.length}
                onPress={() => router.push(`/item/${item.id}`)} onToggle={() => { feedback(item.done ? 'uncomplete' : 'complete'); toggleDone(item.id); }} onDelete={() => removeItem(item.id)} />
              {planned ? <View style={styles.inlineAction}><TextButton label="Not today after all" tone="muted" onPress={() => unplanTask(item.id)} accessibilityLabel={`Remove ${item.title} from today's work plan`} /></View> : null}
            </Animated.View>
          );
        })}
        {openItems.length === 0 ? <T token="callout" color={c.inkSecondary} style={{ paddingVertical: 10 }}>{completed.length ? 'Everything on your list is done.' : 'Nothing on your list today.'}</T> : null}
        {completed.length ? (
          <>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: completedExpanded }} onPress={() => setCompletedExpanded((o) => !o)} style={styles.disclosure}>
              <T token="caption" color={c.inkSecondary}>Completed · {completed.length}</T>
              <Icon name={completedExpanded ? 'chevronLeft' : 'chevronRight'} size={16} color={c.inkSecondary} />
            </Pressable>
            {completedExpanded ? (
              <Animated.View entering={enter.drop} exiting={exit.fade}>
                {completed.map((item, i) => (
                  <Animated.View key={item.id} layout={layout} entering={enter.fade} exiting={exit.fade}>
                    <ItemRow item={item} today={now.date} last={i === completed.length - 1} onPress={() => router.push(`/item/${item.id}`)} onToggle={() => { feedback('uncomplete'); toggleDone(item.id); }} onDelete={() => removeItem(item.id)} />
                  </Animated.View>
                ))}
              </Animated.View>
            ) : null}
          </>
        ) : null}
      </Animated.View>

      {overdue.length ? (
        <View style={styles.section}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Still open, ${overdue.length} tasks`} accessibilityState={{ expanded: overdueExpanded }} onPress={() => setOverdueExpanded((o) => !o)} style={styles.disclosure}>
            <GroupLabel>{`Still open · ${overdue.length}`}</GroupLabel>
            <T token="caption" color={c.inkSecondary}>{overdueExpanded ? 'Hide' : 'Show'}</T>
          </Pressable>
          {overdueExpanded ? (
            <Animated.View entering={enter.drop} exiting={exit.fade}>
              {overdue.map((item, i) => (
                <Animated.View key={item.id} layout={layout} entering={enter.fade} exiting={exit.fade}>
                  <ItemRow item={item} today={now.date} last={i === overdue.length - 1} onPress={() => router.push(`/item/${item.id}`)} onToggle={() => { feedback('complete'); toggleDone(item.id); }} onDelete={() => removeItem(item.id)} />
                  <View style={styles.inlineAction}><TextButton label="Work on it today" onPress={() => workOnToday([item.id])} accessibilityLabel={`Work on ${item.title} today without changing its date`} /></View>
                </Animated.View>
              ))}
              {overdue.length > 1 ? (
                <View style={styles.actions}>
                  <TextButton label="Bring all into today" onPress={() => workOnToday(overdue.map((item) => item.id))} />
                  <TextButton label="Mark all done" tone="muted" onPress={() => markAllDone(overdue.map((item) => item.id))} accessibilityLabel={`Mark all ${overdue.length} open tasks done`} />
                </View>
              ) : null}
            </Animated.View>
          ) : null}
        </View>
      ) : null}

      {suggestions.length ? (
        <View style={styles.section}>
          <GroupLabel>Start today</GroupLabel>
          {suggestions.map(({ item, reason }, i) => (
            <View key={item.id}>
              <ListRow title={item.kind === 'event' ? `Prepare for ${item.title}` : item.title} sub={reason} last={i === suggestions.length - 1} onPress={() => router.push(`/item/${item.id}`)} />
              <View style={[styles.inlineAction, { flexDirection: 'row', gap: 20 }]}>
                {item.kind === 'task' ? <TextButton label="Work on it today" onPress={() => workOnToday([item.id])} /> : null}
                <TextButton label="Not today" tone="muted" onPress={() => { dismissSuggestion(item.id, now.date); feedback('select'); }} />
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {upcoming.length || nextWeekPending || tomorrow ? (
        <View style={styles.section}>
          <SectionTitle title="Coming up" onPress={() => router.push('/plan')} />
          {tomorrow ? <ListRow title="Tomorrow" sub={tomorrow} onPress={() => router.push('/plan')} /> : null}
          {upcoming.map((item, i) => (
            <Animated.View key={item.id} layout={layout} entering={enter.fade} exiting={exit.fade}>
              <ItemRow item={item} today={now.date} last={i === upcoming.length - 1 && !nextWeekPending} onPress={() => router.push(`/item/${item.id}`)}
                onToggle={() => { feedback('complete'); toggleDone(item.id); }} onDelete={() => removeItem(item.id)} />
            </Animated.View>
          ))}
          {upcoming.filter((item) => tightDeadlines.has(item.id)).slice(0, 1).map((item) => (
            <T key={item.id} token="caption" color={c.inkSecondary} style={{ paddingTop: 6 }}>{deadlineReason(items, item, now, tightDeadlines.get(item.id))}</T>
          ))}
          {nextWeekPending ? <ListRow title="Next week's shifts" sub="Not added yet" last onPress={() => router.push({ pathname: '/capture', params: { source: 'image' } })} /> : null}
        </View>
      ) : null}

      {isSample ? (
        <View style={styles.section}>
          <ListRow title="This is a sample week" sub="Clear it any time in Your data" last onPress={() => router.push('/settings/data')} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: SCREEN_GUTTER, gap: 2 },
  topRow: { paddingHorizontal: SCREEN_GUTTER, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  topText: { flex: 1, minWidth: 0, gap: 2 },
  bar: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 22 },
  hours: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 18 },
  section: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 26 },
  disclosure: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inlineAction: { paddingLeft: 34 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 20 },
  momentLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingTop: 6 },
});
