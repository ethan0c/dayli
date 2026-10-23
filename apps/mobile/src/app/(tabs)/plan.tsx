import { addDays, assessment, conflictIds, diffDays, formatRange, formatTime, movableOverlap, pendingDates, relativeDay, toMinutes, weekdayLong, weekdayShort, weekOf, planCount , count } from '@dayli/core';
import type { Item } from '@dayli/schema';
import { router, useIsFocused } from 'expo-router';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { CategoryDot, IconButton, ListRow, SectionTitle, StatusPill, TextButton } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { ItemDetail } from '@/components/ItemDetail';
import { Segmented } from '@/components/Segmented';
import { WeekBoard } from '@/components/WeekBoard';
import { ItemRow } from '@/components/ItemRow';
import { TimeField } from '@/components/Native';
import { Button } from '@/components/Sheet';
import { PlanMonthCalendar, PlanMonthTitle, TodayPill } from '@/components/PlanCalendar';
import { Press } from '@/components/Press';
import { T } from '@/components/Text';
import { TabHeader } from '@/components/TabHeader';
import { TodayStart } from '@/components/TodayStart';
import { ChartKey, keyOf, markKey, shapeFor } from '@/components/ChartMark';
import { WeekChart, type WeekDay } from '@/components/WeekChart';
import { SHARING_ENABLED } from '@/lib/auth';
import { feedback } from '@/lib/feedback';
import { COLUMN, useWebLayout } from '@/lib/layout';
import { useWebShortcuts } from '@/lib/shortcuts';
import { enter, exit, layout } from '@/lib/motion';
import { useNow } from '@/lib/now';
import { defaultTimes } from '@/lib/times';
import { useReschedule } from '@/lib/use-reschedule';
import { useSettling } from '@/lib/use-settling';
import { useCourseList, useScheduleList, useItemList, useStore } from '@/store';
import { SCREEN_GUTTER, NAV_INSET, useTheme, shadow, screen, radius, size } from '@/theme';

/** "HH:MM" plus some minutes, capped at midnight. */
function addMinutes(time: string, mins: number): string {
  const total = Math.min(24 * 60, toMinutes(time) + mins);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** An event's end for the chart: its own end, midnight if it runs overnight, or an hour after it starts. */
function eventEnd(item: Item): string {
  if (!item.start) return '00:00';
  if (item.end && item.end !== item.start) return item.end < item.start ? '24:00' : item.end;
  return addMinutes(item.start, 60);
}

/** A work shift with no time yet: the row that asks for one. */
/** Any event that came in without a time; Plan asks for it in place, as the review promised. */
const isUntimedEvent = (item: Item) => item.kind === 'event' && !item.start;

export default function PlanScreen() {
  const { c } = useTheme();
  const now = useNow();
  const items = useItemList();
  const schedules = useScheduleList();
  const courses = useCourseList();
  const toggleDone = useStore((s) => s.toggleDone);
  const removeItem = useStore((s) => s.removeItem);
  const updateItem = useStore((s) => s.updateItem);
  const [selected, updateSelected] = useState(useStore.getState().selectedPlanDate ?? now.date);
  const [calendarOpen, setCalendarOpen] = useState(false);
  // The chart answers the tap at once; the agenda below follows as a deferred render.
  const shown = useDeferredValue(selected);
  const selectedRef = useRef(selected);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  // Only this screen reads the saved date, on mount, so save it on the way out, not on every tap
  // (each store write re-serialises the whole plan).
  useEffect(() => () => useStore.getState().setSelectedPlanDate(selectedRef.current), []);
  const setSelected = useCallback((date: string) => {
    updateSelected(date);
    setCalendarOpen(false);
  }, []);
  /** Which untimed shifts have a time picker open, per field. */
  const [timing, setTiming] = useState<Record<string, { start?: boolean; end?: boolean }>>({});
  const week = useMemo(() => weekOf(selected), [selected]);
  const weekStart = week[0]!;
  const weekEnd = week[6]!;

  // Which way did the week change? Drives the slide-in direction of the chart.
  const [lastStart, setLastStart] = useState(weekStart);
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);
  if (lastStart !== weekStart) {
    setDirection(weekStart > lastStart ? 'next' : 'prev');
    setLastStart(weekStart);
  }

  // The swipe hint under the chart shows until the person has moved by week once; the key stays.
  const legendSeen = useStore((s) => s.settings.firsts.week);
  const moveWeek = useCallback((step: 1 | -1) => {
    updateSelected((date) => addDays(date, step * 7));
    setCalendarOpen(false);
    const { settings, setSettings } = useStore.getState();
    if (!settings.firsts.week) setSettings({ firsts: { ...settings.firsts, week: true } });
  }, []);
  // A wide web window opens an item beside the list instead of on its own screen.
  const { twoPane } = useWebLayout();
  const [openId, setOpenId] = useState<string | null>(null);
  // A wide web window can show the week as a board of day columns instead of the chart and one day.
  const [view, setView] = useState<'week' | 'board'>('week');
  const board = twoPane && view === 'board';
  const openItem = (id: string) => (twoPane ? setOpenId(id) : router.push(`/item/${id}`));
  const focused = useIsFocused();
  const selectDay = useCallback((date: string) => {
    if (date !== selectedRef.current) feedback('select');
    setSelected(date);
  }, [setSelected]);

  // The web: arrows move by day, Shift+arrows by week, T comes back to today, Esc closes the item.
  useWebShortcuts({
    ArrowLeft: () => selectDay(addDays(selectedRef.current, -1)),
    ArrowRight: () => selectDay(addDays(selectedRef.current, 1)),
    'Shift+ArrowLeft': () => moveWeek(-1),
    'Shift+ArrowRight': () => moveWeek(1),
    t: () => selectDay(now.date),
    Escape: () => setOpenId(null),
  }, focused);

  // Swipe the chart for the previous or next week, the way the week strip did.
  const swipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, { dx, dy }) => Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 1.5,
    onPanResponderRelease: (_, { dx }) => {
      if (Math.abs(dx) < 45) return;
      feedback('select');
      moveWeek(dx < 0 ? 1 : -1);
    },
  }), [moveWeek]);

  const weekItems = useMemo(() => items.filter((i) => i.date >= weekStart && i.date <= weekEnd), [items, weekStart, weekEnd]);
  const weekConflicts = useMemo(() => conflictIds(items.filter((i) => i.date >= addDays(weekStart, -1) && i.date <= weekEnd)), [items, weekStart, weekEnd]);
  const workHours = useMemo(() => Math.round(weekItems
    .filter((i) => i.kind === 'event' && i.category === 'work' && i.start)
    .reduce((sum, i) => sum + Math.max(0, toMinutes(eventEnd(i)) - toMinutes(i.start!)), 0) / 60), [weekItems]);
  const nowMin = toMinutes(now.time);
  const days = useMemo<WeekDay[]>(() => week.map((date) => {
    const list = weekItems.filter((i) => i.date === date);
    const blocks = list.filter((i) => i.kind === 'event' && i.start).map((i) => {
      const end = eventEnd(i);
      const past = date < now.date || (date === now.date && toMinutes(end) <= nowMin);
      return { id: i.id, start: i.start!, end, kind: i.category === 'work' || i.employer ? 'shift' as const : 'other' as const, tone: i.done ? 'green' as const : past ? 'grey' as const : weekConflicts.has(i.id) ? 'red' as const : 'ink' as const };
    });
    const marks = list.filter((i) => i.isDeadline && i.start).map((i) => ({ id: i.id, time: i.start!, kind: shapeFor(assessment(i.title)) }));
    return { date, blocks, marks, unknown: list.some(isUntimedEvent) };
  }), [week, weekItems, weekConflicts, now.date, nowMin]);

  // A row just checked holds its place while the check fills, then sinks to the done end.
  const [settling, settle] = useSettling();
  const dayItems = useMemo(() => {
    const list = items.filter((i) => i.date === shown);
    const untimed = list.filter((i) => !i.start);
    const timed = list.filter((i) => i.start).sort((a, b) => a.start!.localeCompare(b.start!));
    const sunk = (i: Item) => Number(i.done && !settling.includes(i.id));
    return [...untimed, ...timed].sort((a, b) => sunk(a) - sunk(b));
  }, [items, shown, settling]);
  const conflicts = useMemo(() => conflictIds(items.filter((i) => i.date === shown || i.date === addDays(shown, -1))), [items, shown]);
  const dayOverlaps = dayItems.filter((i) => conflicts.has(i.id)).length;
  const rest = useMemo(() => weekItems.filter((i) => !i.done && i.date > shown).slice(0, 4), [weekItems, shown]);
  // The week after this one has no schedule yet, and this one is at least partly covered.
  const nextWeekPending = schedules.length > 0
    && pendingDates(schedules, weekStart, weekEnd).length < 7
    && pendingDates(schedules, addDays(weekEnd, 1), addDays(weekEnd, 7)).length > 0;
  const nextDeadline = useMemo(() => items
    .filter((i) => i.isDeadline && !i.done && diffDays(shown, i.date) >= 1 && diffDays(shown, i.date) <= 2)
    .sort((a, b) => a.date.localeCompare(b.date))[0], [items, shown]);
  // The day's soonest overlap Semli could resolve: the flexible event moves, the other stays.
  const move = useMemo(() => movableOverlap(items, now, shown), [items, now, shown]);
  const reschedule = useReschedule(move?.flexible ?? null, items);
  const starting = items.length === 0 && schedules.length === 0;
  const isToday = shown === now.date;

  const where = (it: Item) => courses.find((k) => k.id === it.courseId)?.code ?? it.employer ?? (it.category === 'school' ? 'Coursework' : it.category === 'work' ? 'Work' : 'Personal');

  /** Another shift for the same employer earlier this week that has times, to copy. */
  const sameAs = (it: Item) => weekItems
    .filter((o) => o.id !== it.id && o.kind === 'event' && o.employer === it.employer && o.date < it.date && o.start && o.end)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  const openCapture = () => router.navigate({ pathname: '/add', params: { source: 'image', at: String(Date.now()) } });
  const thisWeek = weekOf(now.date)[0] === weekStart;
  const header = (<>
    <TabHeader
      value={<PlanMonthTitle selected={selected} today={now.date} expanded={calendarOpen} onToggle={() => setCalendarOpen((open) => !open)} />}
      trailing={<View style={styles.trailing}>
        {twoPane ? <View style={{ width: 170 }}><Segmented size="small" label="Plan view" value={view} onChange={(next) => { feedback('select'); setView(next); }}
          options={[{ key: 'week', label: 'Week' }, { key: 'board', label: 'Board' }]} /></View> : null}
        {!thisWeek
          ? <Animated.View entering={enter.fade} exiting={exit.fade}><TodayPill onPress={() => setSelected(now.date)} /></Animated.View>
          : SHARING_ENABLED ? <IconButton icon="share" label="Preview schedule sharing" tone="glass" onPress={() => router.push({ pathname: '/share-schedule', params: { date: selected } })} /> : null}
      </View>}
      details={!calendarOpen && starting
        ? <T token="callout" color={c.inkSecondary}>Add events or tasks to see them here. Review imports before saving.</T>
        : undefined} />
    {/* Under the header row, not in its column, so the Today pill beside the title never narrows the grid. */}
    {calendarOpen ? <View style={styles.calendar}><PlanMonthCalendar selected={selected} today={now.date} onSelect={setSelected} /></View> : null}
  </>);

  if (starting) return (
    <ScrollView style={{ backgroundColor: c.canvas }} contentContainerStyle={{ paddingBottom: NAV_INSET }} contentInsetAdjustmentBehavior="never">
      <TodayStart date={selected} tab="Plan" header={header} />
    </ScrollView>
  );

  const renderShift = (it: Item) => {
    const open = timing[it.id] ?? {};
    const copy = sameAs(it);
    return (
      <View style={[styles.shift, { borderBottomColor: c.line }]}>
        <ListRow title={it.title} sub={it.start ? where(it) : `${where(it)} · No time yet, so no reminder`} chevron={false} last
          leading={<View style={styles.lead}><CategoryDot color={c.category[it.category].ink} /></View>}
          trailing={it.start ? <StatusPill label={formatTime(it.start)} /> : <StatusPill label="Add a time" tone="amber" tabular={false} />}
          onPress={() => openItem(it.id)} />
        <View style={styles.timeRow}>
          {open.start ? (
            <TimeField date={it.date} time={it.start} onChange={(start) => updateItem(it.id, { start })} />
          ) : (
            <Press accessibilityRole="button" accessibilityLabel={it.start ? `Start time, ${formatTime(it.start)}` : 'Start time, not set'} haptic="select"
              onPress={() => { if (!it.start) updateItem(it.id, defaultTimes(it, copy)); setTiming((t) => ({ ...t, [it.id]: { ...t[it.id], start: true } })); }} style={[styles.timePill, { backgroundColor: c.row }]}>
              <T token="subhead" tabular>{it.start ? formatTime(it.start) : 'Start'}</T>
            </Press>
          )}
          {open.end ? (
            <TimeField date={it.date} time={it.end} onChange={(end) => updateItem(it.id, { end })} />
          ) : (
            <Press accessibilityRole="button" accessibilityLabel={it.end ? `End time, ${formatTime(it.end)}` : 'End time, not set'} haptic="select"
              onPress={() => { if (!it.start || !it.end) updateItem(it.id, defaultTimes(it, copy)); setTiming((t) => ({ ...t, [it.id]: { ...t[it.id], end: true } })); }} style={[styles.timePill, { backgroundColor: c.row }]}>
              <T token="subhead" tabular>{it.end ? formatTime(it.end) : 'End'}</T>
            </Press>
          )}
          {copy ? (
            <TextButton label={`Same as ${weekdayLong(copy.date)}`} style={{ marginLeft: 6 }} accessibilityLabel={`Same times as ${weekdayLong(copy.date)}`}
              onPress={() => updateItem(it.id, { start: copy.start, end: copy.end })} />
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: c.canvas }}>
      <ScrollView style={twoPane && !board ? { width: COLUMN, flexGrow: 0 } : { flex: 1 }} contentInsetAdjustmentBehavior="never" contentContainerStyle={{ paddingBottom: NAV_INSET }}>
        {header}
        {board ? (
          <View style={styles.boardWrap}>
            <WeekBoard week={week} items={weekItems} today={now.date} conflicts={weekConflicts} openId={openId} onOpen={(id) => { feedback('select'); setOpenId(id); }} />
          </View>
        ) : <>
        <Animated.View key={weekStart} entering={direction === 'next' ? enter.fromRight : direction === 'prev' ? enter.fromLeft : undefined}
          style={styles.chart} {...swipe.panHandlers}>
          <WeekChart days={days} selected={selected} today={now.date} onWeek={moveWeek} onSelect={selectDay} />
        </Animated.View>
        <View style={styles.legend}>
          <T token="callout" color={c.inkSecondary} tabular>{`${planCount(weekItems)}${workHours ? ` · ${workHours} work ${workHours === 1 ? 'hour' : 'hours'}` : ''}`}</T>
          <ChartKey entries={keyOf([
            // Every glyph on the chart has a line here, including the plain blocks and the now line.
            days.some((d) => d.blocks.some((b) => b.tone === 'ink' && b.kind === 'shift')) && { glyph: 'block', color: c.chartBooked, label: 'Work' },
            days.some((d) => d.blocks.some((b) => b.tone === 'ink' && b.kind === 'other')) && { glyph: 'block', color: c.chartOther, label: 'Other' },
            days.some((d) => d.blocks.some((b) => b.tone === 'green')) && { glyph: 'block', color: c.added, label: 'Done' },
            days.some((d) => d.blocks.some((b) => b.tone === 'grey')) && { glyph: 'block', color: c.controlOutline, label: 'Past' },
            days.some((d) => d.blocks.some((b) => b.tone === 'red')) && { glyph: 'block', color: c.conflict, label: 'Overlap' },
            ...markKey(days.flatMap((d) => d.marks ?? []), c),
            days.some((d) => d.unknown) && { glyph: 'outline', color: c.changed, label: 'Needs a time' },
            thisWeek && { glyph: 'now', color: c.inkPrimary, label: 'Now' },
          ])} />
          {legendSeen ? null : <T token="caption" color={c.inkSecondary}>Swipe for next week.</T>}
        </View>

        <Animated.View layout={layout} style={styles.section}>
          <SectionTitle title={isToday ? 'Today' : weekdayLong(shown)}
            detail={isToday
              ? dayItems.length ? `${planCount(dayItems)}${dayOverlaps ? ` · ${count(dayOverlaps, 'overlap')}` : ''}` : undefined
              : relativeDay(now.date, shown)} />
          {dayItems.length ? dayItems.map((it) => (
            <Animated.View key={it.id} layout={layout} entering={enter.fade} exiting={exit.fade}>
              {isUntimedEvent(it) || timing[it.id] ? renderShift(it) : (
                <ItemRow item={it} today={now.date} conflict={conflicts.has(it.id)}
                  onPress={() => openItem(it.id)}
                  onToggle={() => { feedback(it.done ? 'uncomplete' : 'complete'); if (!it.done) settle(it.id); toggleDone(it.id); }}
                  onDelete={() => removeItem(it.id)} />
              )}
            </Animated.View>
          )) : (
            <Animated.View key={shown} entering={enter.fade} exiting={exit.fade}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 4 }}>
                <Icon name="calendar" size={24} color={c.inkTertiary} />
                <T token="body">No plans for this day.</T>
              </View>
              <T token="callout" color={c.inkSecondary} style={{ paddingTop: 2 }}>
                {nextDeadline ? `${nextDeadline.title} is due ${diffDays(shown, nextDeadline.date) === 1 ? 'the next day' : 'in two days'}.` : 'Add an event or task below.'}
              </T>
              <View style={styles.actions}>
                <TextButton label="Add something" onPress={() => router.push({ pathname: '/create', params: { kind: 'task', date: shown } })} />
                <TextButton label="Add from a screenshot" onPress={openCapture} />
              </View>
            </Animated.View>
          )}
          {move ? (
            <Animated.View key={move.flexible.id} layout={layout} entering={enter.fade} exiting={exit.fade} style={styles.move}>
              <T token="callout" color={c.inkSecondary}>{`${move.flexible.title} overlaps ${move.other.title}. ${move.other.title} stays at its current time.`}</T>
              {reschedule.loading && !reschedule.isPlus ? null : !reschedule.isPlus ? (
                <Button label="Find a time with Plus" variant="secondary" onPress={() => void reschedule.openPlus()} />
              ) : reschedule.suggestion ? (
                <Button label={reschedule.busy ? 'Checking…' : `Move to ${reschedule.suggestion.date === move.flexible.date ? formatRange(reschedule.suggestion.start, reschedule.suggestion.end) : reschedule.label}`}
                  disabled={reschedule.busy} onPress={() => void reschedule.apply()} />
              ) : (
                <View>
                  <T token="callout" color={c.inkSecondary}>No free time found in the next seven days.</T>
                  <TextButton label={`Choose a time for ${move.flexible.title}`} onPress={() => openItem(move.flexible.id)} style={{ alignSelf: 'flex-start', minHeight: 44 }} />
                </View>
              )}
              {reschedule.notice ? <T token="callout" color={c.conflict} accessibilityRole="alert">{reschedule.notice}</T> : null}
            </Animated.View>
          ) : null}
        </Animated.View>

        {rest.length || nextWeekPending ? (
          <Animated.View layout={layout} style={styles.section}>
            <SectionTitle title="Rest of the week" />
            {rest.map((it, i) => (
              <Animated.View key={it.id} layout={layout} entering={enter.fade} exiting={exit.fade}>
                <ListRow title={it.title} sub={[where(it), it.isDeadline ? 'Deadline' : null].filter(Boolean).join(' · ')} chevron={false} last={i === rest.length - 1 && !nextWeekPending}
                  trailing={<StatusPill label={`${weekdayShort(it.date)}${it.start ? ` ${formatTime(it.start, true)}` : ''}`} />}
                  onPress={() => openItem(it.id)} />
              </Animated.View>
            ))}
            {nextWeekPending ? (
              <ListRow title="Next week's shifts" sub="Not added yet" chevron={false} last trailing={<StatusPill label="Add them" tone="amber" tabular={false} />} onPress={openCapture} />
            ) : null}
          </Animated.View>
        ) : null}
        </>}
      </ScrollView>
      {/* The board keeps its seven columns; an open item slides over its right side instead. */}
      {twoPane && (!board || openId) ? (
        <View style={[styles.pane, { borderLeftColor: c.line }, board ? [styles.over, { backgroundColor: c.canvas }] : null]}>
          {openId ? <ItemDetail key={openId} id={openId} onClose={() => setOpenId(null)} onOpen={setOpenId} /> : (
            <View style={styles.paneEmpty}>
              <T token="callout" color={c.inkSecondary}>Choose something on the left to see it here.</T>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 16 },
  calendar: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 12 },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  over: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 460, boxShadow: shadow.pane },
  boardWrap: { paddingHorizontal: SCREEN_GUTTER },
  pane: { flex: 1, borderLeftWidth: StyleSheet.hairlineWidth },
  paneEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SCREEN_GUTTER },
  legend: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 8, gap: 8 },
  section: { paddingHorizontal: SCREEN_GUTTER, ...screen.section },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 24, paddingTop: 4 },
  move: { gap: 12, paddingTop: 14 },
  shift: { borderBottomWidth: StyleSheet.hairlineWidth },
  lead: { width: 22, alignItems: 'center', justifyContent: 'center' },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingLeft: 34, paddingBottom: 14 },
  timePill: { height: size.pill, borderRadius: radius.pill, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
});
