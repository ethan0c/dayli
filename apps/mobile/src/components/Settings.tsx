import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { GroupLabel, ListRow } from '@/components/Controls';
import { NativeToggle } from '@/components/Native';
import { T } from '@/components/Text';
import { textStyle, useTheme } from '@/theme';

/** A sentence-case label and a run of hairline rows on the paper. No card, no icon tiles. Pass `label` to draw your own. */
export function Group({ title, label, footer, children }: { title?: string; label?: ReactNode; footer?: string; children: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={styles.group}>
      {title ? <GroupLabel>{title}</GroupLabel> : label ?? null}
      <View>{children}</View>
      {footer ? (
        <T token="caption" color={c.inkSecondary} style={styles.footer}>
          {footer}
        </T>
      ) : null}
    </View>
  );
}

export function Row({ label, value, onPress, selected, destructive, last }: {
  label: string; value?: string; onPress?: () => void; selected?: boolean; destructive?: boolean; last?: boolean;
}) {
  const { c } = useTheme();
  return (
    <ListRow
      title={label}
      onPress={onPress}
      last={last}
      destructive={destructive}
      chevron={!!onPress && selected === undefined && !destructive}
      trailing={
        <>
          {value ? <T token="callout" color={c.inkSecondary} numberOfLines={1} style={{ maxWidth: '55%' }}>{value}</T> : null}
          {selected ? <View style={[styles.radio, { backgroundColor: c.inkPrimary }]}><View style={[styles.radioDot, { backgroundColor: c.onPrimary }]} /></View> : selected === false ? <View style={[styles.radio, { borderWidth: 1.5, borderColor: c.controlOutline }]} /> : null}
        </>
      }
    />
  );
}

export function ToggleRow({ label, value, onChange, last }: { label: string; value: boolean; onChange: (v: boolean) => void; last?: boolean }) {
  return <ListRow title={label} last={last} chevron={false} trailing={<NativeToggle value={value} onChange={onChange} label={label} />} />;
}

/** A labelled one-line field inside a settings group. */
export function FieldRow({ label, value, onChange, placeholder, last }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; last?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={[styles.fieldRow, !last ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line } : null]}>
      <T token="body" style={{ width: 96 }}>{label}</T>
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
  group: { gap: 4 },
  footer: { paddingTop: 8 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
  radio: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 7, height: 7, borderRadius: 4 },
});
