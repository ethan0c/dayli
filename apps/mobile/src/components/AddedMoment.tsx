import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { Press } from '@/components/Press';
import { T } from '@/components/Text';
import { Ticker } from '@/components/Ticker';
import { durations, ease, enter } from '@/lib/motion';
import { SCREEN_GUTTER, useTheme, space } from '@/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const SIZE = 72;
/** The tick inside the circle, in a 72 box, and the length of its stroke for the draw. */
const TICK = 'M23 37 L32 46 L50 27';
const TICK_LENGTH = 40;
/** How long the moment holds once drawn before Plan takes over: two `slow` beats after the draw. */
const HOLD = durations.base + durations.slow * 3;

/**
 * The one celebration: the first import a person confirms. The page clears to canvas, a green
 * tick draws itself, and the count rolls up from zero beside its meaning, then Plan takes over
 * on its own. One success haptic, given by the confirm; no confetti, no bounce, no scale pulse.
 * Tap anywhere to go on sooner.
 */
export function AddedMoment({ count, onDone }: { count: number; onDone: () => void }) {
  const { c } = useTheme();
  const [shown, setShown] = useState('0');
  const draw = useSharedValue(0);
  useEffect(() => {
    draw.value = withDelay(durations.base, withTiming(1, { duration: durations.slow, easing: ease }));
    // One frame at zero first, so the digits roll up instead of arriving.
    const roll = setTimeout(() => setShown(String(count)), durations.base);
    const done = setTimeout(onDone, HOLD + durations.slow);
    return () => { clearTimeout(roll); clearTimeout(done); };
  }, [count, draw, onDone]);
  const tick = useAnimatedProps(() => ({ strokeDashoffset: TICK_LENGTH * (1 - draw.value) }));
  return (
    <Animated.View entering={enter.fade} style={[StyleSheet.absoluteFill, { backgroundColor: c.canvas }]}>
      <Press accessibilityRole="button" accessibilityLabel={`${count} ${count === 1 ? 'item' : 'items'} added to your plan. Continue`} onPress={onDone}
        scale={1} dim={1} style={styles.page}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} accessible={false}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2} fill={c.addedBg} />
          <AnimatedPath d={TICK} stroke={c.added} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none"
            strokeDasharray={TICK_LENGTH} animatedProps={tick} />
        </Svg>
        <View style={styles.line}>
          <Ticker value={shown} token="displayXl" />
          <T token="lead" color={c.inkSecondary}>{count === 1 ? 'item added to your plan' : 'items added to your plan'}</T>
        </View>
      </Press>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xl, paddingHorizontal: SCREEN_GUTTER },
  line: { alignItems: 'center', gap: space.xxs },
});
