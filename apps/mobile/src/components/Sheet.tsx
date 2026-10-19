import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { T } from '@/components/Text';
import { SCREEN_GUTTER, useTheme } from '@/theme';

/** Chrome shared by the modal screens: grabber, title row with close, safe-area padding. */
export function Sheet({
  title,
  subtitle,
  children,
  footer,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const close = onClose ?? (() => router.back());
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: c.canvas, paddingTop: Platform.OS === 'ios' ? 8 : insets.top }]}>
      <View style={styles.head}>
        <View style={styles.close} />
        <T token="headline" style={{ flex: 1, textAlign: 'center' }} accessibilityRole="header">{title}</T>
        <Pressable onPress={close} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
          <Icon name="x" size={21} color={c.inkSecondary} />
        </Pressable>
      </View>
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
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        primary ? { backgroundColor: c.inkPrimary } : { borderWidth: 1, borderColor: c.line },
        { opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
      ]}>
      <T token="headline" color={primary ? c.canvas : c.inkPrimary}>
        {label}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: SCREEN_GUTTER - 8, minHeight: 56, paddingBottom: 8 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  subtitle: { textAlign: 'center', paddingHorizontal: SCREEN_GUTTER, paddingBottom: 20, fontSize: 14, lineHeight: 20 },
  body: { flex: 1 },
  footer: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 12, gap: 8 },
  btn: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
