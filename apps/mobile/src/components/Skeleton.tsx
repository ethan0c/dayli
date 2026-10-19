import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { ease } from '@/lib/motion';
import { radius, useTheme } from '@/theme';

/** A placeholder block that breathes. Lay these out exactly where the content will land. */
export function Skeleton({ width = '100%', height = 16, round = 8, style }: { width?: DimensionValue; height?: number; round?: number; style?: object }) {
  const { c } = useTheme();
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(0.5, { duration: 700, easing: ease }), withTiming(1, { duration: 700, easing: ease })), -1, false);
  }, [pulse]);
  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return <Animated.View accessible={false} style={[{ width, height, borderRadius: round, backgroundColor: c.row }, animated, style]} />;
}

/** Agenda-shaped placeholders: a time column and two lines of text, like ItemRow. */
export function SkeletonRows({ count = 3 }: { count?: number }) {
  const { c } = useTheme();
  return (
    <View accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.row, i < count - 1 ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line } : null]}>
          <Skeleton width={44} height={12} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width={i % 2 ? '58%' : '74%'} height={14} />
            <Skeleton width="38%" height={11} />
          </View>
          <Skeleton width={22} height={22} round={11} />
        </View>
      ))}
    </View>
  );
}

/** A card-shaped placeholder, for prices and featured content. */
export function SkeletonCard({ height = 72 }: { height?: number }) {
  return <Skeleton height={height} round={radius.card} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 72, paddingVertical: 16 },
});
