import { Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/Controls';
import { navigationButtonOptions } from '@/components/NavButtons';
import { Press } from '@/components/Press';
import { T } from '@/components/Text';
import { SCREEN_GUTTER, useTheme } from '@/theme';

/** Height of the native navigation bar below the status bar. */
const NAV_BAR = 44;

/**
 * Chrome shared by full-screen covers and pushed detail screens. The title lives in the
 * native iOS header: covers get a glass X on the left, pushes get a glass back chevron.
 */
export function Sheet({ title, subtitle, children, footer, onClose, nav = 'cover', headerRight, inline = false }: {
  title: string; subtitle?: string; children: ReactNode; footer?: ReactNode; onClose?: () => void;
  /** `cover` slides up with an X; `push` slides in with a back chevron. */
  nav?: 'cover' | 'push';
  headerRight?: () => ReactNode;
  /** A pane beside a list on a wide window (the web's Plan): its own title row and X, no navigation header. */
  inline?: boolean;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
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
      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

/** Primary, secondary, or explicitly purple accent pill. One primary action per screen. */
export function Button({ label, onPress, disabled, variant = 'primary' }: {
  label: string; onPress: () => void; disabled?: boolean; variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
}) {
  const { c } = useTheme();
  const primary = variant === 'primary';
  const accent = variant === 'accent';
  return (
    <Press onPress={onPress} disabled={disabled} haptic="tap" accessibilityRole="button" accessibilityState={{ disabled: !!disabled }}
      style={[styles.btn, { backgroundColor: accent ? c.accent : primary ? c.controlFill : c.row, opacity: disabled ? 0.4 : 1 }]}>
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
});
