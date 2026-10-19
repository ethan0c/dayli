import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { T } from '@/components/Text';
import { radius, useTheme } from '@/theme';

const LINES = ['Reading', 'Finding the dates', 'Sorting out your week', 'Checking what changed'];

/**
 * The import loading state: three tinted dots breathe in sequence while the
 * status line changes, so a 5-second wait feels like work, not a stall.
 */
export function Reading({ source }: { source: string }) {
  const { c } = useTheme();
  const [dots] = useState(() => [0, 1, 2].map(() => new Animated.Value(0)));
  const [line, setLine] = useState(0);

  useEffect(() => {
    const loops = dots.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(v, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 420, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay(480 - i * 160),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    const id = setInterval(() => setLine((n) => (n + 1) % LINES.length), 1500);
    return () => {
      loops.forEach((l) => l.stop());
      clearInterval(id);
    };
  }, [dots]);

  const colors = [c.tint.lavender, c.tint.apricot, c.tint.mint];
  return (
    <View style={[styles.card, { backgroundColor: c.accentSoft, borderColor: c.accentBorder }]} accessibilityLiveRegion="polite">
      <View style={styles.dots}>
        {dots.map((v, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: colors[i]!.ink,
                opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
                transform: [
                  { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) },
                  { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }) },
                ],
              },
            ]}
          />
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
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.card, borderWidth: 1 },
  dots: { flexDirection: 'row', gap: 6, width: 48, justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
