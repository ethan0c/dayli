import { motion } from '@dayli/tokens';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type GestureResponderEvent, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { feedback, type Cue } from '@/lib/feedback';
import { durations, ease, springs } from '@/lib/motion';
import { corner, useTheme } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Shrink while pressed. Defaults to the token; pass 1 for text that should only dim. */
  scale?: number;
  /** Opacity while pressed. Defaults to the token; text headers pass `fade.pressed`. */
  dim?: number;
  /** Haptic to fire on press, through the Sounds/Haptics switches. */
  haptic?: Cue;
};

/**
 * The one pressable for buttons and cards. It shrinks and dims under the finger
 * on the UI thread, springs back on release, and never snaps.
 */
export function Press({ style, scale = motion.press.scale, dim = motion.press.opacity, haptic, onPressIn, onPressOut, onPress, ...rest }: Props) {
  const down = useSharedValue(0);
  const baseOpacity = StyleSheet.flatten(style)?.opacity ?? 1;
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - (1 - scale) * down.value }],
    opacity: baseOpacity * (1 - (1 - dim) * down.value),
  }));
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e: GestureResponderEvent) => {
        down.value = withSpring(1, springs.snappy);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        down.value = withSpring(0, springs.snappy);
        onPressOut?.(e);
      }}
      onPress={(e: GestureResponderEvent) => {
        if (haptic) feedback(haptic);
        onPress?.(e);
      }}
      style={[style, animated]}
    />
  );
}

type RowProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** How far the highlight reaches past the row's edges, so it can take in the gutter or a check. */
  bleed?: number | { left?: number; right?: number };
  /** The highlight's corner radius. */
  round?: number;
  /** The highlight's colour, for rows drawn on a fixed palette (the paywall); defaults to the theme's row grey. */
  highlight?: string;
  haptic?: Cue;
};

/**
 * The pressable for rows. A grey highlight fades in under the finger and fades out a little
 * slower on release, the way iOS Settings rows do; the row itself never shrinks or dims.
 */
export function PressRow({ style, children, bleed = 0, round = 0, highlight, haptic, onPressIn, onPressOut, onPress, ...rest }: RowProps) {
  const { c } = useTheme();
  const down = useSharedValue(0);
  const layer = useAnimatedStyle(() => ({ opacity: down.value }));
  const left = typeof bleed === 'number' ? bleed : bleed.left ?? 0;
  const right = typeof bleed === 'number' ? bleed : bleed.right ?? 0;
  return (
    <Pressable
      {...rest}
      onPressIn={(e: GestureResponderEvent) => {
        down.set(withTiming(1, { duration: durations.fast, easing: ease }));
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        down.set(withTiming(0, { duration: durations.base, easing: ease }));
        onPressOut?.(e);
      }}
      onPress={(e: GestureResponderEvent) => {
        if (haptic) feedback(haptic);
        onPress?.(e);
      }}
      style={style}>
      <Animated.View pointerEvents="none" style={[styles.highlight, { left: -left, right: -right, backgroundColor: highlight ?? c.row }, round ? corner(round) : null, layer]} />
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  highlight: { position: 'absolute', top: 0, bottom: 0 },
});
