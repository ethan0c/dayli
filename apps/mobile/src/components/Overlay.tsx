import { useEffect, useRef } from 'react';
import { colors } from '@dayli/tokens';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { T } from '@/components/Text';
import { durations, ease, enter, exit, springs } from '@/lib/motion';
import { useStore } from '@/store';
import { SCREEN_GUTTER, radius, useTheme, space, size } from '@/theme';

/** Lifts the toast off a light page; a light toast on a dark page needs none. */
const shadow = { shadowColor: colors.ink, shadowOpacity: 0.16, shadowRadius: 20, shadowOffset: { width: 0, height: 6 } };
/** A drag this far down, or a flick this fast (points per second), sends the toast away. */
const DISMISS = { distance: 32, speed: 500 };

/**
 * Rises from the tab bar on a spring, sinks away on its own or when undone. A pill that hugs
 * its sentence, in inverted ink (ink on a light page, near-white on a dark one) so it reads in
 * either mode; Undo is its one action. `offset` is the space the tab bar needs.
 *
 * Each new message is its own toast: the last one sinks as the next rises, rather than its words
 * changing in place. Drag it down to put it away; let go short of that and it springs back with
 * the finger's speed, without overshooting. Dragged up, it barely gives.
 */
export function Toast({ offset }: { offset: number }) {
  const { c, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useStore((s) => s.toast);
  const hide = useStore((s) => s.hideToast);
  const undo = useStore((s) => s.undoBatch);
  const undoDone = useStore((s) => s.undoDone);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(hide, 6000);
    return () => clearTimeout(id);
  }, [toast, hide]);

  // A new key for every message, so a replacement plays its own entrance.
  const seen = useRef<{ toast: typeof toast; key: number }>({ toast: null, key: 0 });
  if (toast && seen.current.toast !== toast) seen.current = { toast, key: seen.current.key + 1 };

  const y = useSharedValue(0);
  const away = useSharedValue(1);
  useEffect(() => {
    y.value = 0;
    away.value = 1;
  }, [toast, y, away]);
  const drag = usePanGesture({
    onUpdate: (e) => {
      'worklet';
      y.value = e.translationY > 0 ? e.translationY : e.translationY / 4;
    },
    onDeactivate: (e) => {
      'worklet';
      if (e.translationY > DISMISS.distance || e.velocityY > DISMISS.speed) {
        y.value = withTiming(y.value + DISMISS.distance, { duration: durations.fast, easing: ease });
        away.value = withTiming(0, { duration: durations.fast, easing: ease }, (done) => { if (done) scheduleOnRN(hide); });
      } else {
        y.value = withSpring(0, { ...springs.snappy, velocity: e.velocityY });
      }
    },
  });
  const dragged = useAnimatedStyle(() => ({ opacity: away.value, transform: [{ translateY: y.value }] }));

  const canUndo = !!(toast?.batchId || toast?.doneIds);
  return (
    <View pointerEvents="box-none" style={[styles.lane, { bottom: insets.bottom + offset + 64 }]}>
      {toast ? (
        <Animated.View key={seen.current.key} entering={enter.rise} exiting={exit.sink} accessibilityLiveRegion="polite" style={styles.slot}>
          <GestureDetector gesture={drag}>
            <Animated.View style={[styles.toast, { backgroundColor: c.inkPrimary }, dark ? null : shadow, dragged]}>
              <T token="callout" color={c.canvas} style={styles.message} numberOfLines={2}>{toast.message}</T>
              {canUndo ? (
                <Press haptic="undo" onPress={() => (toast.batchId ? undo(toast.batchId) : undoDone(toast.doneIds!))} hitSlop={10} style={styles.undo}
                  accessibilityRole="button" accessibilityLabel={`Undo: ${toast.message}`}>
                  <Icon name="undo" size={14} color={c.canvas} />
                  <T token="subhead" color={c.canvas}>Undo</T>
                </Press>
              ) : null}
            </Animated.View>
          </GestureDetector>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lane: { position: 'absolute', left: SCREEN_GUTTER, right: SCREEN_GUTTER, alignItems: 'center' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: size.target, paddingVertical: space.sm, paddingLeft: space.md, paddingRight: space.md, borderRadius: radius.pill, maxWidth: '100%' },
  slot: { maxWidth: '100%' },
  message: { flexShrink: 1 },
  undo: { flexDirection: 'row', alignItems: 'center', gap: space.xxs },
});
