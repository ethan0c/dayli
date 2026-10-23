import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Icon } from '@/components/Icon';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { springs } from '@/lib/motion';
import { useTheme } from '@/theme';

/** A grey track with a theme-colored pill that slides to the chosen option and shows a tick, unless `tick` is off for a tight row. */
export function Segmented<K extends string>({ options, value, onChange, label, size = 'regular', tick = true }: {
  options: { key: K; label: string }[]; value: K; onChange: (key: K) => void; label: string; size?: 'regular' | 'small'; tick?: boolean;
}) {
  const { c } = useTheme();
  const [width, setWidth] = useState(0);
  const pad = 3;
  const gap = 2;
  const segW = width > 0 ? (width - pad * 2 - gap * (options.length - 1)) / options.length : 0;
  const index = Math.max(0, options.findIndex((o) => o.key === value));
  const x = useSharedValue(index * (segW + gap));
  useEffect(() => {
    x.value = withSpring(index * (segW + gap), springs.snappy);
  }, [index, segW, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const h = size === 'small' ? 30 : 38;
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.track, { backgroundColor: c.row, padding: pad, gap }]}>
      {segW > 0 ? <Animated.View pointerEvents="none" style={[styles.pill, { width: segW, height: h, top: pad, left: pad, backgroundColor: c.controlFill }, pill]} /> : null}
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable key={o.key} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => { if (!on) { feedback('select'); onChange(o.key); } }}
            style={[styles.seg, { height: h }]}>
            {on && tick ? <Icon name="tick" size={14} color={c.controlInk} strokeWidth={2.5} /> : null}
            <T token="subhead" color={on ? c.controlInk : c.inkSecondary}>{o.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: 999, position: 'relative' },
  pill: { position: 'absolute', borderRadius: 999 },
  seg: { flex: 1, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8 },
});
