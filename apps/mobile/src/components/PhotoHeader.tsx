import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Photo } from '@/components/Photo';
import { isDecoded } from '@/lib/images';
import { durations, ease } from '@/lib/motion';

/** Stops along the fade, eased (opacity = t^1.3) so the photo lets go gradually, then all at once. */
const STOPS = Array.from({ length: 12 }, (_, i) => (i + 1) / 12);

/**
 * A full-bleed photo at the top of a screen that fades into the page color, for moment days and
 * Today's sky. The fade is one SVG gradient of the page color, not stacked strips, which left
 * hairline seams across the text at fractional heights. With `solidAt`, the page
 * color is fully opaque from that point down, so text placed below it never sits on the photo,
 * whatever the photo is.
 */
export function PhotoHeader({ source, height, to, fadeFrom = 0.45, solidAt, dim = 0 }: { source: number; height: number; to: string; fadeFrom?: number; solidAt?: number; dim?: number }) {
  const top = height * fadeFrom;
  const end = solidAt ?? height;
  // Already decoded before the splash lifted: shown on the first frame, no fade.
  const [ready, setReady] = useState(() => isDecoded(source));
  const loaded = useSharedValue(isDecoded(source) ? 1 : 0);
  useEffect(() => {
    if (ready) loaded.value = withTiming(1, { duration: durations.base, easing: ease });
  }, [ready, loaded]);
  const fade = useAnimatedStyle(() => ({ opacity: loaded.value }));
  return (
    <View pointerEvents="none" style={[styles.wrap, { height }]}>
      <Animated.View style={[{ width: '100%', height }, fade]}>
        <Photo source={source} style={{ width: '100%', height }} onLoad={() => setReady(true)} />
      </Animated.View>
      {dim > 0 ? <View style={[StyleSheet.absoluteFill, { backgroundColor: to, opacity: dim }]} /> : null}
      <Svg style={{ position: 'absolute', left: 0, right: 0, top }} width="100%" height={end - top} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            {[<Stop key={0} offset={0} stopColor={to} stopOpacity={0} />,
              ...STOPS.map((t) => <Stop key={t} offset={t} stopColor={to} stopOpacity={Math.min(1, Math.pow(t, 1.3))} />)]}
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#fade)" />
      </Svg>
      {end < height ? <View style={{ position: 'absolute', left: 0, right: 0, top: end, bottom: 0, backgroundColor: to }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0 },
});
