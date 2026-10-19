import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Icon } from '@/components/Icon';
import { durations, ease } from '@/lib/motion';
import { useTheme } from '@/theme';

/** One right-facing chevron rotates down as its section expands. */
export function DisclosureChevron({ expanded, size = 16 }: { expanded: boolean; size?: number }) {
  const { c } = useTheme();
  const angle = useSharedValue(expanded ? 90 : 0);
  useEffect(() => {
    angle.value = withTiming(expanded ? 90 : 0, { duration: durations.base, easing: ease });
  }, [expanded, angle]);
  const rotation = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));
  return (
    <Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={rotation}>
      <Icon name="chevronRight" size={size} color={c.disclosureInk} />
    </Animated.View>
  );
}
