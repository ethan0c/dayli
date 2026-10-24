import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { motion } from '@dayli/tokens';

import { SkeletonReview } from '@/components/Skeleton';
import { T } from '@/components/Text';
import { Swap } from '@/components/Ticker';
import { ease } from '@/lib/motion';
import { useTheme, space } from '@/theme';

const LINES = ['Reading', 'Finding the dates', 'Sorting out your week', 'Checking what changed'];

/** A 2px indeterminate line, the only loading indicator in the app. Sits under a header or at the top of content. */
export function ProgressLine() {
  const { c } = useTheme();
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withRepeat(withTiming(1, { duration: motion.sweep, easing: ease }), -1, false);
  }, [x]);
  const bar = useAnimatedStyle(() => ({ transform: [{ translateX: -160 + x.value * 560 }] }));
  return (
    <View style={[styles.track, { backgroundColor: c.row }]} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <Animated.View style={[styles.bar, { backgroundColor: c.inkPrimary }, bar]} />
    </View>
  );
}

/**
 * The import loading state: a progress line, a light heading that changes, and the review
 * drawn as placeholders where the result will land. No box, no dots.
 */
export function Reading({ source, chart = 'week' }: { source: string; chart?: 'week' | 'term' }) {
  const { c } = useTheme();
  const [line, setLine] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setLine((n) => (n + 1) % LINES.length), 1500);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={{ gap: space.md }} accessibilityLiveRegion="polite">
      <ProgressLine />
      <View style={{ gap: space.xxs }}>
        <Swap value={`${LINES[line]}…`} token="display" />
        <T token="callout" color={c.inkSecondary}>
          {source[0]?.toUpperCase() + source.slice(1)} · Nothing is saved until you confirm.
        </T>
      </View>
      <SkeletonReview chart={chart} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 2, borderRadius: 1, overflow: 'hidden' },
  bar: { width: 160, height: 2, borderRadius: 1 },
});
