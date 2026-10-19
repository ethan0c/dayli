import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { AddMenu } from '@/components/AddMenu';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { useStore } from '@/store';
import { SCREEN_GUTTER, useTheme } from '@/theme';

const shadow = { shadowColor: '#18171C', shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8 };

/** `offset` is the space the tab bar needs. */
export function CaptureFab({ offset }: { offset: number }) {
  const insets = useSafeAreaInsets();
  return <AddMenu bottom={insets.bottom + offset} />;
}

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
    <View style={[styles.toast, { bottom: insets.bottom + offset + 64, backgroundColor: c.nav }]}>
      <T token="subhead" color={c.onNav} style={{ flex: 1 }} numberOfLines={2}>
        {toast.message}
      </T>
      {toast.batchId ? (
        <Pressable onPress={() => {
            feedback('undo');
            undo(toast.batchId!);
          }} hitSlop={8} style={styles.undo}>
          <Icon name="undo" size={14} color={c.onNav} />
          <T token="subhead" color={c.onNav}>
            Undo
          </T>
        </Pressable>
      ) : null}
    </View>
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
