import { useRef, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { Icon, type IconKey } from '@/components/Icon';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { useTheme, space } from '@/theme';

const WIDTH = 88;
/** How far the row must travel for a release to complete or delete it. */
const COMMIT = 64;

/**
 * Swipe a row right to complete it, left to delete it. Both fire on release past the
 * commit line; the toast carries Undo. The action's icon and word grow with the drag and land
 * at full size exactly at that line, so the finger can see when letting go will act. A
 * completed row closes again; a deleted one stays open on red while the list fades it out and
 * closes the gap, so it never snaps back before it goes. The caller's handler gives the
 * completion haptic (it knows a last-task success from a plain one); delete's is given here.
 */
export function SwipeRow({ children, onDelete, onComplete, completeLabel = 'Done', completed }: {
  children: ReactNode; onDelete?: () => void; onComplete?: () => void; completeLabel?: string; completed?: boolean;
}) {
  const { c } = useTheme();
  const ref = useRef<SwipeableMethods>(null);
  if (!onDelete && !onComplete) return <>{children}</>;
  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={1.6}
      leftThreshold={COMMIT}
      rightThreshold={COMMIT}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={onComplete ? (_, translation) => (
        <Action translation={translation} color={c.added} align="flex-start" icon={completed ? 'undo' : 'tick'} label={completed ? 'Not done' : completeLabel} />
      ) : undefined}
      renderRightActions={onDelete ? (_, translation) => (
        <Action translation={translation} color={c.conflict} align="flex-end" icon="trash" label="Delete" />
      ) : undefined}
      onSwipeableOpen={(direction) => {
        // Gesture handler 3 names the way the row moved: 'right' opened the left actions (Done),
        // 'left' the right ones (Delete). Read the other way, a swipe to complete deleted the row.
        if (direction === 'right' && onComplete) { ref.current?.close(); onComplete(); }
        if (direction === 'left' && onDelete) { feedback('remove'); onDelete(); }
      }}>
      {children}
    </ReanimatedSwipeable>
  );
}

/** The coloured panel under a swiped row. Its contents follow the finger: faint and small at rest, full at the commit line. */
function Action({ translation, color, align, icon, label }: { translation: SharedValue<number>; color: string; align: 'flex-start' | 'flex-end'; icon: IconKey; label: string }) {
  const { c } = useTheme();
  const content = useAnimatedStyle(() => {
    const p = interpolate(Math.abs(translation.value), [0, COMMIT], [0, 1], Extrapolation.CLAMP);
    return { opacity: p, transform: [{ scale: 0.7 + 0.3 * p }] };
  });
  return (
    <View style={[styles.action, { backgroundColor: color }]}>
      <Animated.View style={[styles.content, { alignItems: align, transformOrigin: align === 'flex-start' ? 'left' : 'right' }, content]}>
        <Icon name={icon} size={18} color={c.onPrimary} strokeWidth={icon === 'trash' ? undefined : 2.5} />
        <T token="subhead" color={c.onPrimary}>{label}</T>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  action: { width: WIDTH, justifyContent: 'center', paddingHorizontal: space.md },
  content: { gap: space.xxs },
});
