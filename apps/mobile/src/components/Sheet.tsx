import { router, Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseButton } from '@/components/NavButtons';
import { Press } from '@/components/Press';
import { T } from '@/components/Text';
import { SCREEN_GUTTER, useTheme } from '@/theme';

/** Height of the native navigation bar below the status bar. */
const NAV_BAR = 44;

/**
 * Chrome shared by full-screen covers and pushed detail screens. The title lives in the
 * native iOS header: covers get an X on the left, pushes get the system back chevron.
 */
export function Sheet({
  title,
  subtitle,
  children,
  footer,
  onClose,
  nav = 'cover',
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  /** `cover` slides up with an X; `push` slides in with a back chevron. */
  nav?: 'cover' | 'push';
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const close = onClose ?? (() => router.back());
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + NAV_BAR}
      style={[styles.root, { backgroundColor: c.canvas }]}>
      <Stack.Screen options={{ headerShown: true, title, headerLeft: nav === 'cover' ? () => <CloseButton onPress={close} /> : undefined }} />
      {subtitle ? <T token="callout" color={c.inkSecondary} style={styles.subtitle}>{subtitle}</T> : null}
      <View style={styles.body}>{children}</View>
      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

export function Button({
  label,
  onPress,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}) {
  const { c } = useTheme();
  const primary = variant === 'primary';
  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      haptic="tap"
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={[styles.btn, primary ? { backgroundColor: c.inkPrimary } : { backgroundColor: c.row }, { opacity: disabled ? 0.4 : 1 }]}>
      <T token="headline" color={primary ? c.onPrimary : c.inkPrimary}>
        {label}
      </T>
    </Press>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  subtitle: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 12, paddingBottom: 20 },
  body: { flex: 1 },
  footer: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 12, gap: 8 },
  btn: { minHeight: 52, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
