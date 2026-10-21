import { addDays, conflictIds, countdownLine, deadlineReason, deadlineWindow, diffDays, findConflicts, featuredCommitment, overdueTasks, pendingDates, startTodaySuggestions, toMinutes, todayItems, tomorrowSummary, type CountdownState } from '@dayli/core';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GroupLabel, IconButton, ListRow, SectionTitle, TextButton } from '@/components/Controls';
import { DayBar } from '@/components/DayBar';
import { DisclosureChevron } from '@/components/DisclosureChevron';
import { HourView } from '@/components/HourView';
import { TodayFirst } from '@/components/Firsts';
import { ItemRow } from '@/components/ItemRow';
import { PhotoHeader } from '@/components/PhotoHeader';
import { SkyHeader } from '@/components/SkyHeader';
import { T } from '@/components/Text';
import { Ticker } from '@/components/Ticker';
import { TabHeader } from '@/components/TabHeader';
import { TodayStart } from '@/components/TodayStart';
import { profile, track } from '@/lib/analytics';
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
  // Open by default: seeing the green tick land is the reward for checking something off.
  const [completedExpanded, setCompletedExpanded] = useState(true);

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
  const timedToday = todays.filter((item) => item.kind === 'event' && item.start).length;
  const completed = todays.filter((item) => item.done);
  const openItems = todays.filter((item) => !item.done);
  const tightDeadlines = useMemo(() => new Map(items
    .filter((item) => !item.done && item.isDeadline && item.start && item.date > now.date && diffDays(now.date, item.date) <= 7)
    .map((item) => [item.id, deadlineWindow(items, item, now)] as const)
    .filter(([, w]) => !w.hasUnknownTimes && w.unbookedHours < 4)), [items, now]);

  // The one big number: minutes until the next commitment, or until the current one ends.
  const nowMin = toMinutes(now.time);
  let state: CountdownState | null = null;
  let big: string | null = null;
  if (featured?.start) {
    if (ongoing && featured.end) {
      state = 'ends';
      big = countdown(toMinutes(featured.end) - nowMin + (toMinutes(featured.end) < toMinutes(featured.start) ? 1440 : 0));
    } else if (!ongoing) {
      const dayGap = diffDays(now.date, featured.date);
      state = 'next';
      big = countdown(toMinutes(featured.start) - nowMin + dayGap * 1440);
    } else {
      state = 'now';
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
      <TodayStart date={now.date} />
    </ScrollView>
  );

  // The number first, then the sentence that finishes it.
  const line = featured && state ? countdownLine(featured, state) : featured?.title ?? null;
  const hours = todayView === 'hours';
  const viewToggle = (
    <Animated.View key={hours ? 'list' : 'chart'} entering={enter.fade} exiting={exit.fade}>
      <IconButton icon={hours ? 'list' : 'chart'} tone="glass" size={44} haptic="select"
        label={hours ? 'Show the list' : 'Show the day by the hour'}
        onPress={() => { const view = hours ? 'list' : 'hours'; setSettings({ todayView: view }); track('today_view_changed', { view, timed: timedToday, source: 'toggle' }); profile({ today_view: view, today_view_source: 'toggle' }); }} />
    </Animated.View>
  );
  const todayDetail = `${todays.length} ${todays.length === 1 ? 'thing' : 'things'}${conflictsToday ? ` · ${conflictsToday} ${conflictsToday === 1 ? 'overlap' : 'overlaps'}` : ''}`;

  return (
    <ScrollView style={{ backgroundColor: c.canvas }} contentContainerStyle={{ paddingBottom: NAV_INSET }} contentInsetAdjustmentBehavior="never" keyboardShouldPersistTaps="handled">
      {/* On a moment day the photo runs from the top edge, the moment takes the big number, and the day's header steps down to display size. */}
      {moment ? (
        <View style={styles.moment}>
          <PhotoHeader source={moment.image} height={330} to={c.canvas} fadeFrom={0.5} />
          <View style={[styles.momentToggle, { top: insets.top + 20 }]}>{viewToggle}</View>
          <T token="callout" color={c.inkSecondary}>{moment.lead}</T>
          <T token="displayXl" tabular>{moment.big}</T>
          <View style={styles.momentLine}>
            <T token="body">{moment.line}</T>
            {moment.action ? <TextButton label={moment.action.label} onPress={() => router.push(moment.action!.href as '/plan')} /> : null}
          </View>
        </View>
      ) : <SkyHeader time={now.time} />}

      <TabHeader date={now.date} title={featured ? 'Now' : 'Clear'} inset={!moment}
        value={moment ? (big ? <Ticker value={big} token="display" /> : <T token="display" accessibilityRole="header">{featured ? 'Now' : 'Clear'}</T>)
          : big ? <Ticker value={big} token="displayXl" /> : undefined}
        trailing={moment ? undefined : viewToggle}
        onPress={featured ? () => router.push(`/item/${featured.id}`) : undefined}
        accessibilityLabel={featured ? [big, line].filter(Boolean).join(' ') : undefined}
        details={featured ? <>
          <T token="body" style={moment ? undefined : { fontSize: 18, lineHeight: 26 }}>{line}</T>
          {featuredWhere && !moment ? <T token="callout" color={c.inkSecondary}>{featuredWhere}</T> : null}
        </> : <T token="callout" color={c.inkSecondary}>{todays.length ? 'Nothing timed left today.' : 'Nothing scheduled today.'}</T>} />

      <Animated.View layout={layout}>
        {hours ? (
          <Animated.View key="hours" entering={enter.fade} exiting={exit.fade} style={styles.hours}>
            <SectionTitle title="Today" detail={todayDetail} />
            <View style={{ paddingTop: 4 }}>
              <HourView items={todays} now={now} conflicts={conflictSet} onPress={(it) => router.push(`/item/${it.id}`)} />
            </View>
          </Animated.View>
        ) : (
          <Animated.View key="list" entering={enter.fade} exiting={exit.fade} style={styles.bar}>
            <DayBar items={todays} now={now} conflicts={conflictSet} />
          </Animated.View>
        )}
      </Animated.View>

      {/* One thing explained at the moment it first matters, in place of a tour (see components/Firsts). */}
      <TodayFirst items={items} now={now} timedToday={timedToday} style={styles.section} />

      <Animated.View layout={layout} style={styles.section}>
        <SectionTitle title="On your list" onPress={() => router.push('/plan')} detail={conflictsToday ? `${conflictsToday} ${conflictsToday === 1 ? 'overlap' : 'overlaps'}` : undefined} />
        {openItems.map((item, i) => {
          const planned = item.date !== now.date && workDates[item.id] === now.date;
          return (
            <Animated.View key={item.id} layout={layout} entering={enter.fade} exiting={exit.fade}>
              <ItemRow item={item} today={now.date} planned={planned} conflict={conflictSet.has(item.id)} last={i === openItems.length - 1 && !completed.length}
                onPress={() => router.push(`/item/${item.id}`)} onToggle={() => { feedback(openItems.length === 1 ? 'success' : 'complete'); toggleDone(item.id); }} onDelete={() => removeItem(item.id)} />
              {planned ? <View style={styles.inlineAction}><TextButton label="Not today after all" tone="muted" onPress={() => unplanTask(item.id)} accessibilityLabel={`Remove ${item.title} from today's work plan`} /></View> : null}
            </Animated.View>
          );
        })}
        {openItems.length === 0 && completed.length ? (
          <Animated.View entering={enter.fade} style={{ paddingVertical: 10, gap: 2 }}>
            <T token="headline" color={c.inkPrimary}>That’s everything for today.</T>
            <T token="callout" color={c.inkSecondary}>{completed.length === 1 ? 'One thing done.' : `All ${completed.length} done.`} Nice work.</T>
          </Animated.View>
        ) : openItems.length === 0 ? <T token="callout" color={c.inkSecondary} style={{ paddingVertical: 10 }}>Nothing on your list today.</T> : null}
        {completed.length ? (
          <>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: completedExpanded }} onPress={() => setCompletedExpanded((o) => !o)} style={styles.disclosure}>
              <T token="caption" color={c.inkSecondary}>Completed · {completed.length}</T>
              <DisclosureChevron expanded={completedExpanded} />
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
          {nextWeekPending ? <ListRow title="Next week's shifts" sub="Not added yet" last onPress={() => router.navigate({ pathname: '/add', params: { source: 'image', at: String(Date.now()) } })} /> : null}
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
  bar: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 22 },
  hours: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 18 },
  section: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 26 },
  disclosure: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inlineAction: { paddingLeft: 34 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 20 },
  moment: { position: 'relative', paddingHorizontal: SCREEN_GUTTER, paddingTop: 206, paddingBottom: 18, gap: 2 },
  momentToggle: { position: 'absolute', right: SCREEN_GUTTER },
  momentLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingTop: 6 },
});
