import { useEffect } from 'react';
import { colors } from '@dayli/tokens';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { T } from '@/components/Text';
import { enter, exit } from '@/lib/motion';
import { useStore } from '@/store';
import { SCREEN_GUTTER, radius, useTheme, space } from '@/theme';

/** Lifts the toast off a light page; a light toast on a dark page needs none. */
const shadow = { shadowColor: colors.ink, shadowOpacity: 0.16, shadowRadius: 20, shadowOffset: { width: 0, height: 6 } };

/**
 * Rises from the tab bar on a spring, sinks away on its own or when undone. A pill that hugs
 * its sentence, in inverted ink (ink on a light page, near-white on a dark one) so it reads in
 * either mode; Undo is its one action. `offset` is the space the tab bar needs.
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
  if (!toast) return null;
  const canUndo = !!(toast.batchId || toast.doneIds);
  return (
    <View pointerEvents="box-none" style={[styles.lane, { bottom: insets.bottom + offset + 64 }]}>
      <Animated.View entering={enter.rise} exiting={exit.sink} accessibilityLiveRegion="polite"
        style={[styles.toast, { backgroundColor: c.inkPrimary }, dark ? null : shadow]}>
        <T token="callout" color={c.canvas} style={styles.message} numberOfLines={2}>{toast.message}</T>
        {canUndo ? (
          <Press haptic="undo" onPress={() => (toast.batchId ? undo(toast.batchId) : undoDone(toast.doneIds!))} hitSlop={10} style={styles.undo}
            accessibilityRole="button" accessibilityLabel={`Undo: ${toast.message}`}>
            <Icon name="undo" size={14} color={c.canvas} />
            <T token="subhead" color={c.canvas}>Undo</T>
          </Press>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  lane: { position: 'absolute', left: SCREEN_GUTTER, right: SCREEN_GUTTER, alignItems: 'center' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44, paddingVertical: space.sm, paddingLeft: space.md, paddingRight: space.md, borderRadius: radius.pill, maxWidth: '100%' },
  message: { flexShrink: 1 },
  undo: { flexDirection: 'row', alignItems: 'center', gap: space.xxs },
});
