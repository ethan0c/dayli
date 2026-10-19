import { isLocalDate, isLocalTime } from '@dayli/core';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon, type IconKey } from '@/components/Icon';
import { T } from '@/components/Text';
import { radius, textStyle, useTheme } from '@/theme';

// Fallbacks for web (and any non-iOS platform). The .ios.tsx file uses SwiftUI.

export interface DateFieldProps {
  date: string | null;
  time: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export interface NativeButtonProps {
  label: string;
  onPress: () => void;
  role?: 'default' | 'cancel' | 'destructive' | 'close';
  color?: string;
  systemImage?: string;
  icon?: IconKey;
}

function Field({ value, placeholder, onChange, valid, width, disabled }: { value: string | null; placeholder: string; onChange: (v: string) => void; valid: boolean; width: number; disabled?: boolean }) {
  const { c } = useTheme();
  return (
    <TextInput
      value={value ?? ''}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={c.inkTertiary}
      autoCapitalize="none"
      autoCorrect={false}
      editable={!disabled}
      style={[styles.field, textStyle('subhead', valid ? c.inkPrimary : c.conflict), { backgroundColor: c.canvas, borderColor: valid ? c.line : c.conflict, width }]}
    />
  );
}

export function DateField({ date, onChange, disabled }: DateFieldProps) {
  return <Field value={date} placeholder="YYYY-MM-DD" onChange={onChange} valid={!!disabled || isLocalDate(date)} width={112} disabled={disabled} />;
}

export function TimeField({ time, onChange, disabled }: DateFieldProps) {
  return <Field value={time} placeholder="HH:MM" onChange={onChange} valid={!!disabled || time === null || isLocalTime(time)} width={68} disabled={disabled} />;
}

export function NativeToggle({ value, onChange }: ToggleProps) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      hitSlop={10}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={[styles.toggle, { backgroundColor: value ? c.inkPrimary : c.line }]}>
      <View style={[styles.knob, { backgroundColor: c.canvas, alignSelf: value ? 'flex-end' : 'flex-start' }]} />
    </Pressable>
  );
}

export function NativeButton({ label, onPress, role, icon }: NativeButtonProps) {
  const { c } = useTheme();
  const ink = role === 'destructive' ? c.conflict : c.inkPrimary;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.btn, { borderColor: c.line, opacity: pressed ? 0.8 : 1 }]}>
      {icon ? <Icon name={icon} size={16} color={ink} /> : null}
      <T token="headline" color={ink}>
        {label}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: { height: 32, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8 },
  toggle: { width: 40, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
  knob: { width: 20, height: 20, borderRadius: 10 },
  btn: { height: 50, borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
