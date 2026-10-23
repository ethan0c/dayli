import { Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/Controls';
import { backOrHome, navigationButtonOptions } from '@/components/NavButtons';
import { Press } from '@/components/Press';
import { T } from '@/components/Text';
import { useWebLayout } from '@/lib/layout';
import { enter, exit } from '@/lib/motion';
import { useWebShortcuts } from '@/lib/shortcuts';
import { SCREEN_GUTTER, useTheme } from '@/theme';

/** Height of the native navigation bar below the status bar. */
const NAV_BAR = 44;

/**
 * Chrome shared by full-screen covers and pushed detail screens. The title lives in the
 * native iOS header: covers get a glass X on the left, pushes get a glass back chevron.
 */
export function Sheet({ title, subtitle, children, footer, onClose, nav = 'cover', headerRight, inline = false, dialog = false }: {
  title: string; subtitle?: string; children: ReactNode; footer?: ReactNode; onClose?: () => void;
  /** `cover` slides up with an X; `push` slides in with a back chevron. */
  nav?: 'cover' | 'push';
  headerRight?: () => ReactNode;
  /** A pane beside a list on a wide window (the web's Plan): its own title row and X, no navigation header. */
  inline?: boolean;
  /** A small form that a wide web window shows as a dialog over the screen it came from (the route is a transparent modal). */
  dialog?: boolean;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { sidebar } = useWebLayout();
  if (dialog && sidebar) return <Dialog title={title} subtitle={subtitle} footer={footer} onClose={onClose ?? backOrHome}>{children}</Dialog>;
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top + NAV_BAR} style={[styles.root, { backgroundColor: c.canvas }]}>
      {inline ? (
        <View style={styles.inlineHead}>
          <T token="headline" style={{ flex: 1 }}>{title}</T>
          {headerRight?.()}
          {onClose ? <IconButton icon="x" label="Close" size={36} onPress={onClose} /> : null}
        </View>
      ) : (
        <Stack.Screen options={{
          headerShown: true,
          title,
          ...navigationButtonOptions(nav === 'cover' ? 'close' : 'back', onClose),
          headerRight,
        }} />
      )}
      {subtitle ? <T token="callout" color={c.inkSecondary} style={styles.subtitle}>{subtitle}</T> : null}
      <View style={styles.body}>{children}</View>
      {footer ? <View style={[styles.footer, sidebar ? styles.footerWide : null, { paddingBottom: Math.max(insets.bottom, 16) }]}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

/**
 * A small form as a dialog on a wide web window: a centred card over the screen it came from, the
 * actions at its foot on the right, closed by the X, a click outside, or Esc.
 */
function Dialog({ title, subtitle, footer, onClose, children }: { title: string; subtitle?: string; footer?: ReactNode; onClose: () => void; children: ReactNode }) {
  const { c } = useTheme();
  useWebShortcuts({ Escape: onClose });
  return (
    <View style={styles.dialogRoot}>
      <Animated.View entering={enter.fade} exiting={exit.fade} style={[StyleSheet.absoluteFill, styles.scrim]}>
        <Pressable accessibilityLabel="Close" onPress={onClose} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <View accessibilityViewIsModal style={[styles.dialog, { backgroundColor: c.surface, borderColor: c.line }]}>
        <View style={styles.dialogHead}>
          <T token="title" style={{ flex: 1, fontSize: 20, lineHeight: 26 }} accessibilityRole="header">{title}</T>
          <IconButton icon="x" label="Close" size={32} onPress={onClose} />
        </View>
        {subtitle ? <T token="callout" color={c.inkSecondary} style={styles.dialogSub}>{subtitle}</T> : null}
        <View style={styles.dialogBody}>{children}</View>
        {footer ? <View style={styles.dialogFoot}>{footer}</View> : null}
      </View>
    </View>
  );
}

/**
 * Primary, secondary, or explicitly purple accent pill. One primary action per screen. On a wide web
 * window it is sized to its label, as desktop buttons are; `block` keeps the full width (sign-in forms).
 */
export function Button({ label, onPress, disabled, variant = 'primary', block = false }: {
  label: string; onPress: () => void; disabled?: boolean; variant?: 'primary' | 'secondary' | 'ghost' | 'accent'; block?: boolean;
}) {
  const { c } = useTheme();
  const { sidebar } = useWebLayout();
  const primary = variant === 'primary';
  const accent = variant === 'accent';
  return (
    <Press onPress={onPress} disabled={disabled} haptic="tap" accessibilityRole="button" accessibilityState={{ disabled: !!disabled }}
      style={[styles.btn, sidebar && !block ? styles.fit : null, { backgroundColor: accent ? c.accent : primary ? c.controlFill : c.row, opacity: disabled ? 0.4 : 1 }]}>
      <T token="headline" color={accent ? c.onAccent : primary ? c.controlInk : c.inkPrimary}>
        {label}
      </T>
    </Press>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inlineHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: SCREEN_GUTTER, paddingTop: 16, paddingBottom: 4 },
  subtitle: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 12, paddingBottom: 20 },
  body: { flex: 1 },
  footer: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 12, gap: 8, alignItems: 'center' },
  btn: { alignSelf: 'stretch', height: 52, paddingHorizontal: 22, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  fit: { alignSelf: 'auto', height: 40, paddingHorizontal: 20 },
  // On a wide window the actions sit at the right; the first (the primary) comes last in reading order.
  footerWide: { flexDirection: 'row-reverse', justifyContent: 'flex-start', alignItems: 'center', paddingBottom: 24 },
  dialogRoot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrim: { backgroundColor: 'rgba(0,0,0,0.22)' },
  dialog: { width: 520, maxWidth: '92%', maxHeight: '86%', borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingTop: 18, paddingBottom: 18, boxShadow: '0 10px 32px rgba(0,0,0,0.14)' },
  dialogHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingBottom: 4 },
  dialogSub: { paddingHorizontal: 24 },
  dialogBody: { flexShrink: 1, minHeight: 0 },
  dialogFoot: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingTop: 14 },
});
