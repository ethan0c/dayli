import { monthDay, weekdayShort } from '@dayli/core';
import { useMemo } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';

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
  const swipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, { dx, dy }) => Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 1.5,
    onPanResponderRelease: (_, { dx }) => {
      if (Math.abs(dx) < 45) return;
      feedback('select');
      if (dx < 0) onNext(); else onPrev();
    },
  }), [onNext, onPrev]);
  return (
    <View style={styles.wrap} {...swipe.panHandlers}>
      {week.map((date) => {
        const isSel = date === selected;
        const isToday = date === today;
        return (
          <Pressable key={date} onPress={() => { if (!isSel) feedback('select'); onSelect(date); }} style={styles.day} accessibilityRole="button" accessibilityState={{ selected: isSel }} accessibilityLabel={`${weekdayShort(date)}, ${monthDay(date)}${isToday ? ', today' : ''}${marked.has(date) ? ', has plans' : ''}`}
            accessibilityHint="Swipe left or right to change week. Tap the date above to return to today."
            accessibilityActions={[{ name: 'increment', label: 'Next week' }, { name: 'decrement', label: 'Previous week' }]}
            onAccessibilityAction={({ nativeEvent }) => { feedback('select'); if (nativeEvent.actionName === 'increment') onNext(); else if (nativeEvent.actionName === 'decrement') onPrev(); }}>
            <View style={[styles.num, isSel ? { backgroundColor: c.surface } : null]}>
              <T token={isSel ? 'headline' : 'body'} color={isToday && !isSel ? c.accent : c.inkPrimary} tabular maxFontSizeMultiplier={1.5}>
                {String(Number(date.slice(-2)))}
              </T>
            </View>
            <T token="caption" color={c.inkSecondary} maxFontSizeMultiplier={1.5}>
              {weekdayShort(date).toLowerCase()}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start' },
  day: { flex: 1, minHeight: 62, alignItems: 'center', gap: 5 },
  num: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
