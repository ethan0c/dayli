import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddMenu } from '@/components/AddMenu';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { T } from '@/components/Text';
import { enter, exit } from '@/lib/motion';
import { useStore } from '@/store';
import { SCREEN_GUTTER, useTheme } from '@/theme';

const shadow = { shadowColor: '#18171C', shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8 };

/** `offset` is the space the tab bar needs. */
export function CaptureFab({ offset }: { offset: number }) {
  const insets = useSafeAreaInsets();
  return <AddMenu bottom={insets.bottom + offset} />;
}

/** Rises from the tab bar on a spring, sinks away on its own or when undone. */
export function Toast({ offset }: { offset: number }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useStore((s) => s.toast);
  const hide = useStore((s) => s.hideToast);
  const undo = useStore((s) => s.undoBatch);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(hide, 6000);
    return () => clearTimeout(id);
  }, [toast, hide]);
  if (!toast) return null;
  return (
    <Animated.View entering={enter.rise} exiting={exit.sink} style={[styles.toast, { bottom: insets.bottom + offset + 64, backgroundColor: c.nav }]}>
      <T token="subhead" color={c.onNav} style={{ flex: 1 }} numberOfLines={2}>
        {toast.message}
      </T>
      {toast.batchId ? (
        <Press haptic="undo" onPress={() => undo(toast.batchId!)} hitSlop={8} style={styles.undo} scale={0.94}>
          <Icon name="undo" size={14} color={c.onNav} />
          <T token="subhead" color={c.onNav}>
            Undo
          </T>
        </Press>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: SCREEN_GUTTER,
    right: SCREEN_GUTTER,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    ...shadow,
  },
  undo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
