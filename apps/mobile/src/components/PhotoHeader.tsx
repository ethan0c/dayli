import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Photo } from '@/components/Photo';
import { isDecoded } from '@/lib/images';
import { durations, ease } from '@/lib/motion';

const STEPS = 28;

/**
 * A full-bleed photo at the top of a screen that fades into the page color, for moment days.
 * The fade is stacked strips so no native gradient module is needed.
 */
export function PhotoHeader({ source, height, to, fadeFrom = 0.45, dim = 0 }: { source: number; height: number; to: string; fadeFrom?: number; dim?: number }) {
  const top = height * fadeFrom;
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
      <View style={{ position: 'absolute', left: 0, right: 0, top, height: height - top }}>
        {Array.from({ length: STEPS }, (_, i) => {
          const t = (i + 1) / STEPS;
          return <View key={i} style={{ flex: 1, backgroundColor: to, opacity: Math.min(1, Math.pow(t, 1.3)) }} />;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0 },
});
