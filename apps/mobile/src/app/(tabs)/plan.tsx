import { addDays, conflictIds, monthDay, pendingDates, weekdayLong, weekOf } from '@dayli/core';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { ClockHeader } from '@/components/ClockHeader';
import { Icon } from '@/components/Icon';
import { ItemRow } from '@/components/ItemRow';
import { SectionTitle } from '@/components/Controls';
import { CaptureCard, ImportRow } from '@/components/PlannerChrome';
import { T } from '@/components/Text';
import { StarterPreview } from '@/components/StarterPreview';
import { WeekStrip } from '@/components/WeekStrip';
import { feedback } from '@/lib/feedback';
import { enter, exit, layout } from '@/lib/motion';
import { useNow } from '@/lib/now';
import { useScheduleList, useItemList, useStore } from '@/store';
import { SCREEN_GUTTER, NAV_INSET, radius, useTheme } from '@/theme';

export default function PlanScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const items = useItemList();
  const schedules = useScheduleList();
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
  const weekItems = items.filter((i) => week.includes(i.date));
  const weekDeadlines = weekItems.filter((i) => i.isDeadline && !i.done).length;
  const starting = items.length === 0 && schedules.length === 0;
  const renderItem = (it: (typeof items)[number]) => (
    <ItemRow key={it.id} item={it} today={now.date} conflict={conflicts.has(it.id)}
      onPress={() => router.push(`/item/${it.id}`)}
      onToggle={() => { feedback(it.done ? 'uncomplete' : 'complete'); toggleDone(it.id); }} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <View style={[styles.head, { paddingTop: insets.top + 12 }]}>
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
      <ScrollView contentInsetAdjustmentBehavior="never" contentContainerStyle={[styles.list, { paddingBottom: NAV_INSET }]}>
        <View style={styles.dayHeading}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous week" onPress={() => setSelected(addDays(selected, -7))} style={styles.weekArrow}><Icon name="chevronLeft" size={18} color={c.inkSecondary} /></Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}><SectionTitle title={`${weekdayLong(selected)}, ${monthDay(selected)}`} /></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Next week" onPress={() => setSelected(addDays(selected, 7))} style={styles.weekArrow}><Icon name="chevronRight" size={18} color={c.inkSecondary} /></Pressable>
        </View>
        {pendingEmployers.map((e) => (
          <View key={e} style={[styles.pending, { borderColor: c.line }]}>
            <Icon name="work" size={18} color={c.inkSecondary} />
            <T color={c.inkSecondary} style={{ flex: 1 }}>
              {e} schedule hasn’t been added yet
            </T>
          </View>
        ))}
        {dayItems.length > 0 ? <Animated.View key={selected} entering={enter.fade} layout={layout} style={styles.group}>{dayItems.map((it) => <Animated.View key={it.id} layout={layout} entering={enter.fade} exiting={exit.fade}>{renderItem(it)}</Animated.View>)}</Animated.View> : null}
        {starting ? <StarterPreview /> : null}
        {dayItems.length === 0 && !starting ? <CaptureCard /> : null}
        {dayItems.length === 0 && !starting ? <View style={[styles.weekNote, { borderColor: c.line }]}>
          <View style={[styles.weekIcon, { backgroundColor: c.row }]}><Icon name="calendar" size={19} color={c.inkSecondary} /></View>
          <View style={{ flex: 1, gap: 4 }}>
            <T token="subhead">This week · {monthDay(week[0]!)}–{monthDay(week[6]!)}</T>
            <T token="caption" color={c.inkSecondary}>{weekItems.length === 0 ? 'Your classes, work, and life can live here together.' : `${weekItems.length} ${weekItems.length === 1 ? 'plan' : 'plans'}${weekDeadlines > 0 ? ` · ${weekDeadlines} ${weekDeadlines === 1 ? 'deadline' : 'deadlines'} ahead` : ' · no deadlines left'}`}</T>
          </View>
        </View> : null}
        {dayItems.length === 0 && !starting ? <ImportRow icon="image" title="Already have a schedule?" detail="Bring a screenshot or PDF. Skip the typing." /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: SCREEN_GUTTER, paddingBottom: 4 },
  list: { paddingTop: 8, paddingHorizontal: SCREEN_GUTTER, gap: 14 },
  group: { gap: 0 },
  dayHeading: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  weekArrow: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  weekNote: { flexDirection: 'row', gap: 12, alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 20 },
  weekIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pending: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 14, borderRadius: radius.row, borderWidth: 1, borderStyle: 'dashed' },
});
