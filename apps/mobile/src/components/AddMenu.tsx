import { localParts } from '@dayli/core';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconKey } from '@/components/Icon';
import { AddButton } from '@/components/AddButton';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { useStore } from '@/store';
import { useTheme } from '@/theme';

type Action = 'capture' | 'task' | 'event';
const actions: { action: Action; label: string; icon: IconKey }[] = [
  { action: 'capture', label: 'Tell Semli', icon: 'sparkle' },
  { action: 'task', label: 'To-do', icon: 'check' },
  { action: 'event', label: 'Event', icon: 'calendar' },
];

/** Keeps the native tab bar; the menu floats above its existing add button. */
export function AddMenu({ bottom }: { bottom: number }) {
  const { c } = useTheme();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [rotation] = useState(() => new Animated.Value(0));
  const pending = useRef<{ action: Action; date: string } | null>(null);
  const selecting = useRef(false);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (active) setReduceMotion(value); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { active = false; subscription.remove(); };
  }, []);

  const open = () => {
    feedback('tap');
    selecting.current = false;
    pending.current = null;
    rotation.setValue(reduceMotion ? 1 : 0);
    setVisible(true);
  };
  const close = () => { pending.current = null; setVisible(false); };
  const navigate = () => {
    const next = pending.current;
    pending.current = null;
    if (!next) return;
    if (next.action === 'capture') router.push('/capture');
    else router.push({ pathname: '/create', params: { kind: next.action, date: next.date } });
  };
  const choose = (action: Action) => {
    if (selecting.current) return;
    selecting.current = true;
    feedback('select');
    pending.current = {
      action,
      date: pathname === '/plan' ? useStore.getState().selectedPlanDate ?? localParts(new Date()).date : localParts(new Date()).date,
    };
    setVisible(false);
    // iOS must finish dismissing this modal before presenting the next sheet.
    if (Platform.OS !== 'ios') navigate();
  };

  return <>
    <AddButton bottom={bottom} expanded={visible} onPress={open} />
    <Modal transparent visible={visible} animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={close} onDismiss={navigate}
      onShow={() => Animated.timing(rotation, { toValue: 1, duration: reduceMotion ? 0 : 160, useNativeDriver: true }).start()}>
      <View style={styles.overlay} accessibilityViewIsModal onAccessibilityEscape={close}>
        <Pressable accessible={false} onPress={close} style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }]} />
        <View style={[styles.menu, { bottom: bottom + 68 }]}>
          {actions.map(({ action, label, icon }) => (
            <Pressable key={action} accessibilityRole="button" accessibilityLabel={label} onPress={() => choose(action)}
              style={({ pressed }) => [styles.action, { backgroundColor: pressed ? c.row : c.surface }]}>
              <Icon name={icon} size={21} color={action === 'capture' ? c.accentInk : c.inkPrimary} />
              <T token="body">{label}</T>
            </Pressable>
          ))}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close add menu" accessibilityState={{ expanded: true }} onPress={close}
          style={[styles.toggle, { bottom, backgroundColor: c.surface }]}>
          <Animated.View style={{ transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }}>
            <Icon name="plus" size={24} color={c.inkPrimary} />
          </Animated.View>
        </Pressable>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  toggle: { position: 'absolute', right: 16, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  menu: { position: 'absolute', right: 16, width: 210, gap: 7 },
  action: { minHeight: 54, paddingHorizontal: 17, paddingVertical: 14, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 11 },
});
