import { monthDay, weekdayShort } from '@dayli/core';
import { typeScale } from '@dayli/tokens';
import { useEffect, useMemo, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { enter, springs } from '@/lib/motion';
import { SCREEN_GUTTER, useTheme } from '@/theme';

type Props = {
  week: string[];
  selected: string;
  today: string;
  marked: Set<string>;
  onSelect: (date: string) => void;
  onPrev: () => void;
  onNext: () => void;
};

const PILL = 36;

/** Seven days. One pill slides between them; a new week slides in from the side it came from. */
export function WeekStrip({ week, selected, today, marked, onSelect, onPrev, onNext }: Props) {
  const { c } = useTheme();
  const { width: window } = useWindowDimensions();
  // The strip bleeds 12pt past the gutter on each side (see styles.wrap).
  const [width, setWidth] = useState(window - 2 * SCREEN_GUTTER + 24);
  const swipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, { dx, dy }) => Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 1.5,
    onPanResponderRelease: (_, { dx }) => {
      if (Math.abs(dx) < 45) return;
      feedback('select');
      if (dx < 0) onNext(); else onPrev();
    },
  }), [onNext, onPrev]);

  // Which way did the week change? Drives the slide-in direction.
  const [lastStart, setLastStart] = useState(week[0]);
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);
  if (lastStart !== week[0]) {
    setDirection((week[0] ?? '') > (lastStart ?? '') ? 'next' : 'prev');
    setLastStart(week[0]);
  }

  const index = week.indexOf(selected);
  const dayWidth = width / 7;
  const target = index * dayWidth + (dayWidth - PILL) / 2;
  // Starts in place (no slide on mount or when a new week mounts), springs on later selections.
  const x = useSharedValue(target);
  useEffect(() => {
    x.value = withSpring(target, springs.gentle);
  }, [target, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <Animated.View
      key={week[0]}
      entering={direction === 'next' ? enter.fromRight : direction === 'prev' ? enter.fromLeft : undefined}
      style={styles.wrap}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      {...swipe.panHandlers}>
      {index >= 0 ? (
        <Animated.View pointerEvents="none" style={[styles.pill, { backgroundColor: c.inkPrimary, top: typeScale.caption.line + 10 }, pill]} />
      ) : null}
      {week.map((date) => {
        const isSel = date === selected;
        const isToday = date === today;
        return (
          <Pressable key={date} onPress={() => { if (!isSel) feedback('select'); onSelect(date); }} style={styles.day} accessibilityRole="button" accessibilityState={{ selected: isSel }} accessibilityLabel={`${weekdayShort(date)}, ${monthDay(date)}${isToday ? ', today' : ''}${marked.has(date) ? ', has plans' : ''}`}
            accessibilityHint="Swipe left or right to change week. Tap the date above to return to today."
            accessibilityActions={[{ name: 'increment', label: 'Next week' }, { name: 'decrement', label: 'Previous week' }]}
            onAccessibilityAction={({ nativeEvent }) => { feedback('select'); if (nativeEvent.actionName === 'increment') onNext(); else if (nativeEvent.actionName === 'decrement') onPrev(); }}>
            <T token="caption" color={isToday ? c.accentInk : c.inkSecondary} maxFontSizeMultiplier={1.5}>
              {weekdayShort(date)}
            </T>
            <View style={styles.num}>
              <T token="body" color={isSel ? c.onPrimary : c.inkPrimary} tabular maxFontSizeMultiplier={1.5}>
                {String(Number(date.slice(-2)))}
              </T>
            </View>
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: -12 },
  day: { flex: 1, minHeight: 76, alignItems: 'center', gap: 10 },
  num: { width: PILL, height: PILL, borderRadius: PILL / 2, alignItems: 'center', justifyContent: 'center' },
  pill: { position: 'absolute', left: 0, width: PILL, height: PILL, borderRadius: PILL / 2 },
});
