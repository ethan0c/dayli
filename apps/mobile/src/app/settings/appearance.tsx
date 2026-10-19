import { ScrollView, StyleSheet } from 'react-native';

import { Group, Row } from '@/components/Settings';
import { feedback } from '@/lib/feedback';
import { SCREEN_GUTTER } from '@/theme';
import { useStore, type Appearance } from '@/store';

const OPTIONS: { id: Appearance; label: string }[] = [
  { id: 'system', label: 'Match iPhone' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

export default function AppearanceScreen() {
  const appearance = useStore((s) => s.settings.appearance);
  const setSettings = useStore((s) => s.setSettings);
  return (
    <ScrollView contentContainerStyle={styles.body} contentInsetAdjustmentBehavior="automatic">
      <Group footer="The Today header changes with the time of day in both modes.">
        {OPTIONS.map((o, i) => (
          <Row
            key={o.id}
            label={o.label}
            selected={appearance === o.id}
            onPress={() => {
              feedback('select');
              setSettings({ appearance: o.id });
            }}
            last={i === OPTIONS.length - 1}
          />
        ))}
      </Group>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ body: { padding: 16, paddingHorizontal: SCREEN_GUTTER, gap: 22 } });
