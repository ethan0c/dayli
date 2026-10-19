import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { SkeletonRows } from '@/components/Skeleton';
import { T } from '@/components/Text';
import { ease } from '@/lib/motion';
import { useTheme } from '@/theme';

const LINES = ['Reading', 'Finding the dates', 'Sorting out your week', 'Checking what changed'];

/** A 2px indeterminate line, the only loading indicator in the app. Sits under a header or at the top of content. */
export function ProgressLine() {
  const { c } = useTheme();
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withRepeat(withTiming(1, { duration: 1400, easing: ease }), -1, false);
  }, [x]);
  const bar = useAnimatedStyle(() => ({ transform: [{ translateX: -160 + x.value * 560 }] }));
  return (
    <View style={[styles.track, { backgroundColor: c.row }]} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <Animated.View style={[styles.bar, { backgroundColor: c.inkPrimary }, bar]} />
    </View>
  );
}

/**
 * The import loading state: a progress line, a light heading that changes, and agenda-shaped
 * placeholders where the result will land. No box, no dots.
 */
export function Reading({ source, rows = 3 }: { source: string; rows?: number }) {
  const { c } = useTheme();
  const [line, setLine] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setLine((n) => (n + 1) % LINES.length), 1500);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={{ gap: 16 }} accessibilityLiveRegion="polite">
      <ProgressLine />
      <View style={{ gap: 4 }}>
        <T token="display">{LINES[line]}…</T>
        <T token="callout" color={c.inkSecondary}>
          {source[0]?.toUpperCase() + source.slice(1)} · Nothing is saved until you confirm.
        </T>
      </View>
      {rows > 0 ? <SkeletonRows count={rows} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 2, borderRadius: 1, overflow: 'hidden' },
  bar: { width: 160, height: 2, borderRadius: 1 },
});
