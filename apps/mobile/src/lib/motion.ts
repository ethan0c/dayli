import { motion } from '@dayli/tokens';
import { Easing, FadeIn, FadeInDown, FadeInLeft, FadeInRight, FadeInUp, FadeOut, FadeOutDown, LinearTransition, type WithSpringConfig } from 'react-native-reanimated';

/**
 * The motion tokens as Reanimated configs. Import these, never raw numbers.
 * Reanimated already honours Reduce Motion for all of them (springs and
 * layout animations jump to their end state), so screens need no extra checks.
 */
export const springs: Record<'snappy' | 'gentle', WithSpringConfig> = {
  snappy: motion.spring.snappy,
  gentle: motion.spring.gentle,
};

export const ease = Easing.bezier(...motion.easing);
export const durations = motion.duration;

/** Rows re-flowing when something is added, removed, or reordered. */
export const layout = LinearTransition.springify().damping(motion.spring.gentle.damping).stiffness(motion.spring.gentle.stiffness).mass(motion.spring.gentle.mass);

/** Entrances and exits. `rise` is for toasts and sheets, `drop` for content revealed under a heading. */
export const enter = {
  fade: FadeIn.duration(motion.duration.base).easing(ease),
  rise: FadeInUp.springify().damping(motion.spring.gentle.damping).stiffness(motion.spring.gentle.stiffness),
  drop: FadeInDown.duration(motion.duration.base).easing(ease),
  fromRight: FadeInRight.duration(motion.duration.base).easing(ease),
  fromLeft: FadeInLeft.duration(motion.duration.base).easing(ease),
  /** A staggered sibling: pass its index. */
  staggered: (i: number) => FadeInUp.springify().damping(motion.spring.gentle.damping).stiffness(motion.spring.gentle.stiffness).delay(i * motion.stagger),
};

export const exit = {
  fade: FadeOut.duration(motion.duration.fast).easing(ease),
  sink: FadeOutDown.duration(motion.duration.base).easing(ease),
};
