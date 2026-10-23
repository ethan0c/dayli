import { useState, type ComponentRef, type Ref } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Press } from '@/components/Press';
import { T } from '@/components/Text';
import { corner, radius, textStyle, useTheme, fade, space, size } from '@/theme';

export function GoogleButton({ onPress, disabled = false }: { onPress: () => void; disabled?: boolean }) {
  return (
    <Press accessibilityRole="button" accessibilityLabel="Continue with Google" accessibilityState={{ disabled }}
      disabled={disabled} onPress={onPress} style={[styles.google, { opacity: disabled ? fade.disabled : 1 }]}>
      <View aria-hidden>
        <Svg width={20} height={20} viewBox="0 0 48 48">
          <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
          <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65Z" />
          <Path fill="#FBBC05" d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.27-3.13.78-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z" />
          <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
        </Svg>
      </View>
      <T token="headline" color="#1F1F1F">Continue with Google</T>
    </Press>
  );
}

export function AuthField({ label, error, password = false, inputRef, ...props }: TextInputProps & {
  label: string; error?: string; password?: boolean; inputRef?: Ref<ComponentRef<typeof TextInput>>;
}) {
  const { c } = useTheme();
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ gap: space.xs }}>
      <T token="callout" color={c.inkSecondary}>{label}</T>
      <View style={[styles.field, { backgroundColor: c.row, borderColor: error ? c.conflict : c.line }]}>
        <TextInput {...props} ref={inputRef} accessibilityLabel={label} secureTextEntry={password && !visible}
          placeholderTextColor={c.inkTertiary} selectionColor={c.accentInk} underlineColorAndroid="transparent"
          style={[textStyle('body', c.inkPrimary), styles.input]} />
        {password ? <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          accessibilityState={{ expanded: visible }} onPress={() => setVisible((value) => !value)} style={styles.visibility}>
          <T token="caption" color={c.inkSecondary}>{visible ? 'Hide' : 'Show'}</T>
        </Pressable> : null}
      </View>
      {error ? <T token="caption" color={c.conflict} accessibilityRole="alert">{error}</T> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  google: { minHeight: 52, paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: 999, borderWidth: 1, borderColor: '#747775', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, alignSelf: 'stretch' },
  field: { minHeight: size.row, ...corner(radius.field), borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', paddingLeft: space.md, paddingRight: space.snug },
  input: { flex: 1, minWidth: 0, paddingVertical: space.md },
  visibility: { minWidth: 52, minHeight: size.target, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xs },
});
