import { motion } from '@dayli/tokens';
import { Pressable, StyleSheet, type GestureResponderEvent, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { feedback, type Cue } from '@/lib/feedback';
import { springs } from '@/lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Shrink while pressed. Defaults to the token; pass 1 for rows that should only dim. */
  scale?: number;
  /** Haptic to fire on press, through the Sounds/Haptics switches. */
  haptic?: Cue;
};

/**
 * The one pressable for buttons and cards. It shrinks and dims under the finger
 * on the UI thread, springs back on release, and never snaps.
 */
export function Press({ style, scale = motion.press.scale, haptic, onPressIn, onPressOut, onPress, ...rest }: Props) {
  const down = useSharedValue(0);
  const baseOpacity = StyleSheet.flatten(style)?.opacity ?? 1;
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - (1 - scale) * down.value }],
    opacity: baseOpacity * (1 - (1 - motion.press.opacity) * down.value),
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
