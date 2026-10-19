import { monthDay, weekdayShort } from '@dayli/core';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { useTheme } from '@/theme';

type Props = {
  week: string[];
  selected: string;
  today: string;
  marked: Set<string>;
  onSelect: (date: string) => void;
  onPrev: () => void;
  onNext: () => void;
};

export function WeekStrip({ week, selected, today, marked, onSelect, onPrev, onNext }: Props) {
  const { c } = useTheme();
  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => { feedback('select'); onPrev(); }} hitSlop={10} style={styles.arrow} accessibilityLabel="Previous week">
        <Icon name="chevronLeft" size={16} color={c.inkTertiary} />
      </Pressable>
      {week.map((date) => {
        const isSel = date === selected;
        const isToday = date === today;
        return (
          <Pressable key={date} onPress={() => { if (!isSel) feedback('select'); onSelect(date); }} style={styles.day} accessibilityRole="button" accessibilityState={{ selected: isSel }} accessibilityLabel={`${weekdayShort(date)}, ${monthDay(date)}${isToday ? ', today' : ''}${marked.has(date) ? ', has plans' : ''}`}>
            <View style={[styles.num, isSel ? { backgroundColor: c.surface } : null]}>
              <T token={isSel ? 'headline' : 'body'} color={isToday && !isSel ? c.accent : c.inkPrimary} tabular>
                {String(Number(date.slice(-2)))}
              </T>
            </View>
            <T token="caption" color={c.inkSecondary}>
              {weekdayShort(date)}
            </T>
            <View style={[styles.dot, { backgroundColor: marked.has(date) ? (isToday ? c.accent : c.inkTertiary) : 'transparent' }]} />
          </Pressable>
        );
      })}
      <Pressable onPress={() => { feedback('select'); onNext(); }} hitSlop={10} style={styles.arrow} accessibilityLabel="Next week">
        <Icon name="chevronRight" size={16} color={c.inkTertiary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start' },
  arrow: { width: 20, minHeight: 44, paddingTop: 10, alignItems: 'center' },
  day: { flex: 1, minHeight: 64, alignItems: 'center', gap: 4 },
  num: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
});
