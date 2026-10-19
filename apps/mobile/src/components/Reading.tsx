import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { SkeletonRows } from '@/components/Skeleton';
import { T } from '@/components/Text';
import { ease } from '@/lib/motion';
import { radius, useTheme } from '@/theme';

const LINES = ['Reading', 'Finding the dates', 'Sorting out your week', 'Checking what changed'];

/**
 * The import loading state: three tinted dots breathe in sequence while the
 * status line changes, and agenda-shaped placeholders show where the result
 * will land, so a 5-second wait feels like work, not a stall.
 */
export function Reading({ source, rows = 3 }: { source: string; rows?: number }) {
  const { c } = useTheme();
  const [line, setLine] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setLine((n) => (n + 1) % LINES.length), 1500);
    return () => clearInterval(id);
  }, []);
  const colors = [c.tint.lavender, c.tint.apricot, c.tint.mint];
  return (
    <View style={{ gap: 8 }}>
      <View style={[styles.card, { backgroundColor: c.accentSoft }]} accessibilityLiveRegion="polite">
        <View style={styles.dots}>
          {colors.map((tint, i) => (
            <Dot key={i} index={i} color={tint.ink} />
          ))}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T token="headline" color={c.accentInk}>
            {LINES[line]}…
          </T>
          <T token="caption" color={c.inkSecondary} numberOfLines={1}>
            {source} · nothing is saved until you confirm
          </T>
        </View>
      </View>
      {rows > 0 ? <SkeletonRows count={rows} /> : null}
    </View>
  );
}

function Dot({ index, color }: { index: number; color: string }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(
      index * 160,
      withRepeat(withSequence(withTiming(1, { duration: 420, easing: ease }), withTiming(0, { duration: 420, easing: ease }), withTiming(0, { duration: 480 })), -1, false),
    );
  }, [index, v]);
  const animated = useAnimatedStyle(() => ({
    opacity: 0.35 + 0.65 * v.value,
    transform: [{ translateY: -7 * v.value }, { scale: 0.85 + 0.3 * v.value }],
  }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, animated]} />;
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.card },
  dots: { flexDirection: 'row', gap: 6, width: 48, justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
