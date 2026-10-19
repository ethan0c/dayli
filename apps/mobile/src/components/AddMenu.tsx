import { localParts } from '@dayli/core';
import { router, usePathname } from 'expo-router';
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconKey } from '@/components/Icon';
import { AddButton } from '@/components/AddButton';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { useStore } from '@/store';
import { SCREEN_GUTTER, useTheme } from '@/theme';

type Action = 'capture' | 'task' | 'event';
const actions: { action: Action; label: string; icon: IconKey }[] = [
  { action: 'capture', label: 'Tell Semli', icon: 'sparkle' },
  { action: 'task', label: 'To-do', icon: 'check' },
  { action: 'event', label: 'Event', icon: 'calendar' },
];

const AddMenuContext = createContext<{ open: () => void; expanded: boolean } | null>(null);
export function useAddMenu() {
  const value = useContext(AddMenuContext);
  if (!value) throw new Error('Add controls must be inside AddMenu.');
  return value;
}

/** The shared capture menu preserves the selected destination underneath. */
export function AddMenu({ bottom, children, nativeTrigger = false }: { bottom: number; children?: ReactNode; nativeTrigger?: boolean }) {
  const { c } = useTheme();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const pending = useRef<{ action: Action; date: string } | null>(null);
  const selecting = useRef(false);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (active) setReduceMotion(value); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { active = false; subscription.remove(); };
  }, []);

  const open = () => {
    feedback('tap');
    selecting.current = false;
    pending.current = null;
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

  return <AddMenuContext.Provider value={{ open, expanded: visible }}>
    {children}
    {!nativeTrigger ? <AddButton bottom={bottom} expanded={visible} onPress={open} /> : null}
    <Modal transparent visible={visible} animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={close} onDismiss={navigate}>
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
          <Icon name="x" size={24} color={c.inkPrimary} />
        </Pressable>
      </View>
    </Modal>
  </AddMenuContext.Provider>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  toggle: { position: 'absolute', right: SCREEN_GUTTER, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  menu: { position: 'absolute', right: SCREEN_GUTTER, width: 210, gap: 8 },
  action: { minHeight: 54, paddingHorizontal: 17, paddingVertical: 14, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 11 },
});
