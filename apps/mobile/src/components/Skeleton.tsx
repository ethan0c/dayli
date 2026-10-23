import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, { cancelAnimation, makeMutable, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { motion } from '@dayli/tokens';

import { ease } from '@/lib/motion';
import { radius, useTheme, space, size } from '@/theme';

/**
 * One breath for every placeholder on screen, so a page of them dims and returns as one
 * instead of each keeping the time it mounted. It runs only while a skeleton is showing.
 */
const breath = makeMutable(1);
let breathing = 0;
function useBreath() {
  useEffect(() => {
    breathing += 1;
    if (breathing === 1) {
      breath.value = withRepeat(withSequence(withTiming(0.5, { duration: motion.pulse, easing: ease }), withTiming(1, { duration: motion.pulse, easing: ease })), -1, false);
    }
    return () => {
      breathing -= 1;
      if (breathing === 0) {
        cancelAnimation(breath);
        breath.value = 1;
      }
    };
  }, []);
  return breath;
}

/** A placeholder block that breathes. Lay these out exactly where the content will land. */
export function Skeleton({ width = '100%', height = 16, round = radius.small, style }: { width?: DimensionValue; height?: number; round?: number; style?: object }) {
  const { c } = useTheme();
  const pulse = useBreath();
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
          <View style={{ flex: 1, gap: space.xs }}>
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
  return <Skeleton height={height} round={radius.field} />;
}

/** The day bar before it has a day: the track and its four labels. */
export function SkeletonDayBar({ labels = true }: { labels?: boolean }) {
  return (
    <View style={{ gap: space.xs }} accessible={false}>
      <Skeleton height={6} round={3} />
      {labels ? <View style={styles.between}>{[36, 30, 30, 48].map((w, i) => <Skeleton key={i} width={w} height={11} round={5} />)}</View> : null}
    </View>
  );
}

/** Seven day bars before the week is known. */
export function SkeletonWeekChart({ height = 120 }: { height?: number }) {
  return (
    <View style={styles.week} accessible={false}>
      {Array.from({ length: 7 }, (_, i) => (
        <View key={i} style={styles.weekCol}>
          <Skeleton width={22} height={11} round={5} />
          <Skeleton width={28} height={28} round={14} />
          <Skeleton height={height} round={6} />
          <Skeleton width={30} height={11} round={5} />
        </View>
      ))}
    </View>
  );
}

/** The term line before its dates are known. */
export function SkeletonTermLine() {
  return (
    <View style={{ gap: space.xs }} accessible={false}>
      <View style={styles.between}>{[24, 28, 24].map((w, i) => <Skeleton key={i} width={w} height={11} round={5} />)}</View>
      <Skeleton height={6} round={3} />
      <View style={styles.between}>{[34, 40, 30].map((w, i) => <Skeleton key={i} width={w} height={11} round={5} />)}</View>
    </View>
  );
}

/** The day by the hour before it has a day: hour rules and two blocks. */
export function SkeletonHourView({ hours = 8 }: { hours?: number }) {
  return (
    <View style={{ gap: 44 }} accessible={false}>
      {Array.from({ length: hours }, (_, i) => (
        <View key={i} style={styles.hourRow}>
          <Skeleton width={34} height={11} round={5} />
          <Skeleton height={i === 1 || i === 4 ? 36 : StyleSheet.hairlineWidth} round={8} style={{ flex: 1 }} />
        </View>
      ))}
    </View>
  );
}

/**
 * The shape of a review while Semli reads: the big number, the week as bars, and
 * three rows. The result lands exactly where these sit.
 */
export function SkeletonReview({ chart = 'week' }: { chart?: 'week' | 'term' }) {
  return (
    <View style={{ gap: space.xl }} accessible={false}>
      <View style={{ gap: space.xs }}>
        <Skeleton width={150} height={12} round={6} />
        <Skeleton width={190} height={48} round={12} />
        <Skeleton width={220} height={14} round={7} />
      </View>
      {chart === 'week' ? <SkeletonWeekChart /> : <SkeletonTermLine />}
      <SkeletonRows count={3} />
    </View>
  );
}

/** The recent-screenshots strip before the photo library answers. */
export function SkeletonShots({ count = 4 }: { count?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: space.xs }} accessible={false}>
      {Array.from({ length: count }, (_, i) => <Skeleton key={i} width={104} height={150} round={radius.field} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: size.item, paddingVertical: space.sm },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  week: { flexDirection: 'row', gap: space.snug },
  weekCol: { flex: 1, alignItems: 'center', gap: space.snug },
  hourRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
