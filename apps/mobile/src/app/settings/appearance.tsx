import { useLingui } from '@lingui/react/macro';
import { ScrollView, StyleSheet } from 'react-native';

import { Group, Row } from '@/components/Settings';
import { feedback } from '@/lib/feedback';
import { SYSTEM_NAME } from '@/lib/web';
import { SCREEN_GUTTER } from '@/theme';
import { useStore, type Appearance } from '@/store';

export default function AppearanceScreen() {
  const { t } = useLingui();
  const options: { id: Appearance; label: string }[] = [
    { id: 'system', label: (SYSTEM_NAME === 'system' ? t`Match system` : t`Match iPhone`) },
    { id: 'light', label: t`Light` },
    { id: 'dark', label: t`Dark` },
  ];

  const appearance = useStore((s) => s.settings.appearance);
  const setSettings = useStore((s) => s.setSettings);
  return (
    <ScrollView contentContainerStyle={styles.body} contentInsetAdjustmentBehavior="automatic">
      <Group footer={t`Light is paper and ink. Dark adds soft purple.`}>
        {options.map((o, i) => (
          <Row
            key={o.id}
            label={o.label}
            selected={appearance === o.id}
            onPress={() => {
              feedback('select');
              setSettings({ appearance: o.id });
            }}
            last={i === options.length - 1}
          />
        ))}
      </Group>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ body: { padding: 16, paddingHorizontal: SCREEN_GUTTER, gap: 28 } });
