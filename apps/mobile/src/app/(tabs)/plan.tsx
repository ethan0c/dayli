import { addDays, conflictIds, pendingDates, weekOf } from '@dayli/core';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClockHeader } from '@/components/ClockHeader';
import { Icon } from '@/components/Icon';
import { ItemRow } from '@/components/ItemRow';
import { T } from '@/components/Text';
import { WeekStrip } from '@/components/WeekStrip';
import { useNow } from '@/lib/now';
import { useItemList, useStore } from '@/store';
import { NAV_INSET, radius, useTheme } from '@/theme';

export default function PlanScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const items = useItemList();
  const schedules = useStore((s) => s.schedules);
  const toggleDone = useStore((s) => s.toggleDone);
  const [selected, setSelected] = useState(now.date);
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

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <View style={[styles.head, { backgroundColor: c.header, paddingTop: insets.top + 4 }]}>
        <ClockHeader time={now.time} date={selected} onPressDate={() => setSelected(now.date)} />
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
        {pendingEmployers.map((e) => (
          <View key={e} style={[styles.pending, { borderColor: c.line }]}>
            <Icon name="work" size={18} color={c.inkSecondary} />
            <T color={c.inkSecondary} style={{ flex: 1 }}>
              {e} schedule hasn’t been added yet
            </T>
          </View>
        ))}
        {dayItems.map((it) => (
          <ItemRow
            key={it.id}
            item={it}
            conflict={conflicts.has(it.id)}
            onPress={() => router.push(`/item/${it.id}`)}
            onToggle={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleDone(it.id);
            }}
          />
        ))}
        {dayItems.length === 0 && pendingEmployers.length === 0 ? (
          <T token="callout" color={c.inkSecondary} style={{ padding: 8 }}>
            Nothing planned for this day yet. Tap + to add something.
          </T>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 16, paddingBottom: 12 },
  list: { padding: 16, gap: 8 },
  pending: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 14, borderRadius: radius.row, borderWidth: 1, borderStyle: 'dashed' },
});
