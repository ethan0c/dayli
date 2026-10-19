import { addDays, conflictIds, monthDay, pendingDates, weekdayLong, weekOf } from '@dayli/core';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ClockHeader } from '@/components/ClockHeader';
import { Icon } from '@/components/Icon';
import { ItemRow } from '@/components/ItemRow';
import { CaptureCard, ImportRow, SectionHeading } from '@/components/PlannerChrome';
import { ScreenHeader } from '@/components/ScreenHeader';
import { T } from '@/components/Text';
import { WeekStrip } from '@/components/WeekStrip';
import { feedback } from '@/lib/feedback';
import { useNow } from '@/lib/now';
import { useItemList, useStore } from '@/store';
import { SCREEN_GUTTER, NAV_INSET, radius, useTheme } from '@/theme';

export default function PlanScreen() {
  const { c } = useTheme();
  const now = useNow();
  const items = useItemList();
  const schedules = useStore((s) => s.schedules);
  const toggleDone = useStore((s) => s.toggleDone);
  const [selected, updateSelected] = useState(useStore.getState().selectedPlanDate ?? now.date);
  const setSelected = (date: string) => {
    updateSelected(date);
    useStore.getState().setSelectedPlanDate(date);
  };
  const week = useMemo(() => weekOf(selected), [selected]);

  const marked = useMemo(() => new Set(items.filter((i) => !i.done).map((i) => i.date)), [items]);
  const dayItems = useMemo(() => {
    const list = items.filter((i) => i.date === selected);
    const untimed = list.filter((i) => !i.start);
    const timed = list.filter((i) => i.start).sort((a, b) => a.start!.localeCompare(b.start!));
    return [...untimed, ...timed].sort((a, b) => Number(a.done) - Number(b.done));
  }, [items, selected]);
  const conflicts = useMemo(() => conflictIds(items.filter((i) => i.date === selected || i.date === addDays(selected, -1))), [items, selected]);
  const pendingEmployers = useMemo(
    () =>
      [...new Set(schedules.map((s) => s.employer))].filter(
        (e) => selected > now.date && pendingDates(schedules.filter((s) => s.employer === e), selected, selected).length > 0,
      ),
    [schedules, selected, now.date],
  );
  const events = dayItems.filter((i) => i.kind === 'event');
  const tasks = dayItems.filter((i) => i.kind === 'task');
  const weekItems = items.filter((i) => week.includes(i.date));
  const weekDeadlines = weekItems.filter((i) => i.isDeadline && !i.done).length;
  const renderItem = (it: (typeof items)[number]) => (
    <ItemRow key={it.id} item={it} conflict={conflicts.has(it.id)}
      onPress={() => router.push(`/item/${it.id}`)}
      onToggle={() => { feedback(it.done ? 'uncomplete' : 'complete'); toggleDone(it.id); }} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <ScreenHeader title="Plan" safeTop />
      <View style={[styles.head, { backgroundColor: c.header }]}>
        <ClockHeader time={now.time} date={selected} onPressDate={() => {
            if (selected !== now.date) feedback('select');
            setSelected(now.date);
          }} />
        <WeekStrip
          week={week}
          selected={selected}
          today={now.date}
          marked={marked}
          onSelect={setSelected}
          onPrev={() => setSelected(addDays(selected, -7))}
          onNext={() => setSelected(addDays(selected, 7))}
        />
      </View>
      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: NAV_INSET }]}>
        <View style={styles.dayHeading}>
          <View style={{ flex: 1, gap: 4 }}>
            <T token="title" accessibilityRole="header">{selected === now.date ? 'Today' : weekdayLong(selected)}</T>
            <T token="caption" color={c.inkSecondary}>{monthDay(selected)} · {dayItems.length === 0 ? 'An open day' : `${events.length} ${events.length === 1 ? 'event' : 'events'} · ${tasks.length} ${tasks.length === 1 ? 'to-do' : 'to-dos'}`}</T>
          </View>
          {selected !== now.date ? (
            <Pressable accessibilityRole="button" onPress={() => setSelected(now.date)} style={[styles.todayButton, { backgroundColor: c.row }]}>
              <T token="subhead" color={c.accentInk}>Today</T>
            </Pressable>
          ) : null}
        </View>
        {pendingEmployers.map((e) => (
          <View key={e} style={[styles.pending, { borderColor: c.line }]}>
            <Icon name="work" size={18} color={c.inkSecondary} />
            <T color={c.inkSecondary} style={{ flex: 1 }}>
              {e} schedule hasn’t been added yet
            </T>
          </View>
        ))}
        {events.length > 0 ? <View style={styles.group}><SectionHeading title="On the schedule" />{events.map(renderItem)}</View> : null}
        {tasks.length > 0 ? <View style={styles.group}><SectionHeading title="To-dos" detail="One thing at a time." />{tasks.map(renderItem)}</View> : null}
        {dayItems.length === 0 ? <CaptureCard /> : null}
        <View style={[styles.weekNote, { borderColor: c.line }]}>
          <View style={[styles.weekIcon, { backgroundColor: c.row }]}><Icon name="calendar" size={19} color={c.inkSecondary} /></View>
          <View style={{ flex: 1, gap: 4 }}>
            <T token="subhead">This week · {monthDay(week[0]!)}–{monthDay(week[6]!)}</T>
            <T token="caption" color={c.inkSecondary}>{weekItems.length === 0 ? 'Your classes, work, and life can live here together.' : `${weekItems.length} ${weekItems.length === 1 ? 'plan' : 'plans'}${weekDeadlines > 0 ? ` · ${weekDeadlines} ${weekDeadlines === 1 ? 'deadline' : 'deadlines'} ahead` : ' · no deadlines left'}`}</T>
          </View>
        </View>
        {dayItems.length === 0 ? <ImportRow icon="image" title="Already have a schedule?" detail="Bring a screenshot or PDF. Skip the typing." /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: SCREEN_GUTTER, paddingBottom: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  list: { padding: 24, paddingHorizontal: SCREEN_GUTTER, gap: 20 },
  dayHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  todayButton: { minHeight: 44, borderRadius: radius.pill, paddingHorizontal: 16, justifyContent: 'center' },
  group: { gap: 8 },
  weekNote: { flexDirection: 'row', gap: 12, alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 20 },
  weekIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pending: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 14, borderRadius: radius.row, borderWidth: 1, borderStyle: 'dashed' },
});
