import { useRef, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Icon } from '@/components/Icon';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { useTheme } from '@/theme';

const WIDTH = 88;

/**
 * Swipe a row right to complete it, left to delete it. Both fire on release past the
 * threshold, then the row closes; the toast carries Undo. The caller's handler gives the
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
      leftThreshold={64}
      rightThreshold={64}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={onComplete ? () => (
        <View style={[styles.action, { backgroundColor: c.added, alignItems: 'flex-start' }]}>
          <Icon name={completed ? 'undo' : 'tick'} size={18} color={c.onPrimary} strokeWidth={2.5} />
          <T token="subhead" color={c.onPrimary}>{completed ? 'Not done' : completeLabel}</T>
        </View>
      ) : undefined}
      renderRightActions={onDelete ? () => (
        <View style={[styles.action, { backgroundColor: c.conflict, alignItems: 'flex-end' }]}>
          <Icon name="trash" size={18} color={c.onPrimary} />
          <T token="subhead" color={c.onPrimary}>Delete</T>
        </View>
      ) : undefined}
      onSwipeableOpen={(direction) => {
        ref.current?.close();
        // Gesture handler 3 names the way the row moved: 'right' opened the left actions (Done),
        // 'left' the right ones (Delete). Read the other way, a swipe to complete deleted the row.
        if (direction === 'right' && onComplete) onComplete();
        if (direction === 'left' && onDelete) { feedback('remove'); onDelete(); }
      }}>
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  action: { width: WIDTH, justifyContent: 'center', paddingHorizontal: 16, gap: 4 },
});
