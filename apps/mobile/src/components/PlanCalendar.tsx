import { monthDay, weekdayLong } from '@dayli/core';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconButton, TextButton } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { T } from '@/components/Text';
import { calendarDays, calendarMonthLabel, moveCalendarMonth } from '@/lib/calendar';
import { feedback } from '@/lib/feedback';
import { useTheme } from '@/theme';

/** Compact replacement for Plan's static date and week labels. */
export function PlanCalendarControl({ selected, expanded, onToggle, onPreviousWeek, onNextWeek }: {
  selected: string; expanded: boolean; onToggle: () => void; onPreviousWeek: () => void; onNextWeek: () => void;
}) {
  const { c } = useTheme();
  return (
    <View style={styles.control}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Choose date, ${weekdayLong(selected)}, ${monthDay(selected)}, ${selected.slice(0, 4)}`}
        accessibilityState={{ expanded }} onPress={() => { feedback('select'); onToggle(); }}
        style={({ pressed }) => [styles.monthButton, { opacity: pressed ? 0.7 : 1 }]}>
        <Icon name="calendar" size={20} color={c.inkPrimary} />
        <View style={styles.controlText}>
          <T token="callout" numberOfLines={1}>{calendarMonthLabel(selected)}</T>
          <T token="caption" color={c.inkSecondary} numberOfLines={1}>{`${weekdayLong(selected)}, ${monthDay(selected)}`}</T>
        </View>
        <View style={{ transform: [{ rotate: expanded ? '-90deg' : '90deg' }] }}>
          <Icon name="chevronRight" size={14} color={c.inkSecondary} />
        </View>
      </Pressable>
      <IconButton icon="chevronLeft" label="Previous week" tone="glass" size={44} haptic="select" onPress={onPreviousWeek} />
      <IconButton icon="chevronRight" label="Next week" tone="glass" size={44} haptic="select" onPress={onNextWeek} />
    </View>
  );
}

/** Month browsing stays local until a day (or Today) is selected. */
export function PlanMonthCalendar({ selected, today, onSelect }: { selected: string; today: string; onSelect: (date: string) => void }) {
  const { c } = useTheme();
  const [month, setMonth] = useState(`${selected.slice(0, 7)}-01`);
  const pick = (date: string) => { feedback('select'); onSelect(date); };
  return (
    <View style={[styles.calendar, { borderColor: c.line }]}>
      <View style={styles.monthRow}>
        <IconButton icon="chevronLeft" label="Previous month" tone="glass" size={44} haptic="select" onPress={() => setMonth((m) => moveCalendarMonth(m, -1))} />
        <T token="headline" accessibilityRole="header" style={styles.monthTitle}>{calendarMonthLabel(month)}</T>
        <IconButton icon="chevronRight" label="Next month" tone="glass" size={44} haptic="select" onPress={() => setMonth((m) => moveCalendarMonth(m, 1))} />
      </View>
      <View style={styles.weekdays} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => <T key={i} token="caption" color={c.inkSecondary} style={styles.weekday}>{label}</T>)}
      </View>
      <View style={styles.grid}>
        {calendarDays(month).map((date) => {
          const on = date === selected;
          const isToday = date === today;
          const inMonth = date.slice(0, 7) === month.slice(0, 7);
          return (
            <Pressable key={date} accessibilityRole="button" accessibilityState={{ selected: on }}
              accessibilityLabel={`${weekdayLong(date)}, ${monthDay(date)}, ${date.slice(0, 4)}${isToday ? ', today' : ''}`}
              onPress={() => pick(date)} style={({ pressed }) => [styles.day, { opacity: pressed ? 0.6 : 1 }]}>
              <View style={[styles.dayCircle, {
                backgroundColor: on ? c.inkPrimary : 'transparent',
                borderColor: isToday && !on ? c.accent : 'transparent',
              }]}>
                <T token="subhead" tabular color={on ? c.onPrimary : inMonth ? c.inkPrimary : c.inkSecondary}>{Number(date.slice(8))}</T>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.today}><TextButton label="Today" onPress={() => onSelect(today)} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  control: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 },
  monthButton: { flex: 1, minWidth: 0, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  controlText: { flex: 1, minWidth: 0, gap: 2 },
  calendar: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 12, marginBottom: 12, gap: 8 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthTitle: { flex: 1, textAlign: 'center' },
  weekdays: { flexDirection: 'row', paddingTop: 4 },
  weekday: { flex: 1, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  day: { width: '14.285714%', minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  today: { alignItems: 'center' },
});
