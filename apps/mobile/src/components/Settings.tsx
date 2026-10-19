import type { ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon, type IconKey } from '@/components/Icon';
import { NativeToggle } from '@/components/Native';
import { T } from '@/components/Text';
import { radius, textStyle, useTheme } from '@/theme';

/** A grouped list in the iOS Settings idiom, drawn with Dayli's tokens. */
export function Group({ title, footer, children }: { title?: string; footer?: string; children: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={styles.group}>
      {title ? (
        <T token="overline" color={c.inkSecondary} style={styles.title}>
          {title}
        </T>
      ) : null}
      <View style={[styles.card, { backgroundColor: c.row }]}>{children}</View>
      {footer ? (
        <T token="caption" color={c.inkSecondary} style={styles.title}>
          {footer}
        </T>
      ) : null}
    </View>
  );
}

export function Row({
  label,
  value,
  icon,
  tint,
  onPress,
  selected,
  destructive,
  last,
}: {
  label: string;
  value?: string;
  icon?: IconKey;
  tint?: string;
  onPress?: () => void;
  selected?: boolean;
  destructive?: boolean;
  last?: boolean;
}) {
  const { c } = useTheme();
  const ink = destructive ? c.conflict : c.inkPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={selected !== undefined ? { selected } : undefined}
      style={({ pressed }) => [styles.row, !last ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line } : null, { opacity: pressed ? 0.7 : 1 }]}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: tint ?? c.canvas }]}>
          <Icon name={icon} size={16} color={ink} />
        </View>
      ) : null}
      <T color={ink} style={{ flex: 1 }}>
        {label}
      </T>
      {value ? (
        <T token="callout" color={c.inkSecondary} numberOfLines={1} style={{ maxWidth: '50%' }}>
          {value}
        </T>
      ) : null}
      {selected ? <Icon name="tick" size={16} color={c.accent} strokeWidth={2.5} /> : null}
      {onPress && selected === undefined && !destructive ? <Icon name="chevronRight" size={16} color={c.inkTertiary} /> : null}
    </Pressable>
  );
}

export function ToggleRow({ label, icon, tint, value, onChange, last }: { label: string; icon: IconKey; tint: string; value: boolean; onChange: (v: boolean) => void; last?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={[styles.row, !last ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line } : null]}>
      <View style={[styles.iconWrap, { backgroundColor: tint }]}>
        <Icon name={icon} size={16} color={c.inkPrimary} />
      </View>
      <T style={{ flex: 1 }}>{label}</T>
      <NativeToggle value={value} onChange={onChange} />
    </View>
  );
}

export function FieldRow({ label, value, onChange, placeholder, last }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; last?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={[styles.row, !last ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line } : null]}>
      <T style={{ width: 96 }}>{label}</T>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.inkTertiary}
        autoCapitalize={label === 'Name' ? 'words' : 'none'}
        autoCorrect={false}
        style={[textStyle('body', c.inkPrimary), { flex: 1, minWidth: 0, padding: 0, textAlign: 'right' }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 6 },
  title: { paddingHorizontal: 16 },
  card: { borderRadius: radius.card, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50, paddingHorizontal: 16 },
  iconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
