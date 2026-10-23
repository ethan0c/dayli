import { useLingui } from '@lingui/react/macro';
import { ScrollView, StyleSheet, TextInput } from 'react-native';

import { T } from '@/components/Text';
import { useStore } from '@/store';
import { SCREEN_GUTTER, textStyle, useTheme } from '@/theme';

export default function NameScreen() {
  const { t } = useLingui();
  const { c } = useTheme();
  const name = useStore((s) => s.settings.name);
  const setSettings = useStore((s) => s.setSettings);
  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic">
      <TextInput
        accessibilityLabel={t`Your first name`}
        value={name}
        onChangeText={(value) => setSettings({ name: value })}
        placeholder={t`Your first name`}
        placeholderTextColor={c.inkTertiary}
        autoFocus
        autoCapitalize="words"
        autoCorrect={false}
        style={[styles.field, textStyle('body', c.inkPrimary), { backgroundColor: c.row }]}
      />
      <T token="caption" color={c.inkSecondary}>{t`Optional. Change or remove your name here.`}</T>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingHorizontal: SCREEN_GUTTER, gap: 12 },
  field: { height: 52, borderRadius: 999, paddingHorizontal: 20 },
});
