import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Icon } from '@/components/Icon';
import { durations, ease } from '@/lib/motion';
import { useTheme } from '@/theme';

/**
 * One right-facing chevron rotates down as its section expands. `turn` gives its collapsed and
 * expanded angles for a chevron that starts elsewhere, like Plan's month title (down, then up).
 */
export function DisclosureChevron({ expanded, size = 16, turn = [0, 90] }: { expanded: boolean; size?: number; turn?: readonly [number, number] }) {
  const { c } = useTheme();
  const [closed, open] = turn;
  const angle = useSharedValue(expanded ? open : closed);
  useEffect(() => {
    angle.value = withTiming(expanded ? open : closed, { duration: durations.base, easing: ease });
  }, [expanded, angle, open, closed]);
  const rotation = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));
  return (
    <Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={rotation}>
      <Icon name="chevronRight" size={size} color={c.disclosureInk} />
    </Animated.View>
  );
}
