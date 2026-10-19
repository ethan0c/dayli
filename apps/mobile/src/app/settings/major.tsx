import { ScrollView, StyleSheet } from 'react-native';

import { Group, Row } from '@/components/Settings';
import { feedback } from '@/lib/feedback';
import { MAJORS } from '@/lib/majors';
import { useStore } from '@/store';
import { SCREEN_GUTTER } from '@/theme';

export default function MajorScreen() {
  const major = useStore((s) => s.settings.major);
  const setSettings = useStore((s) => s.setSettings);
  return (
    <ScrollView contentContainerStyle={styles.body} contentInsetAdjustmentBehavior="automatic">
      <Group footer="Used for the sample week and the examples Semli shows you. Change it any time.">
        {MAJORS.map((m, i) => (
          <Row
            key={m.id}
            icon={m.icon}
            label={m.label}
            selected={(major ?? 'other') === m.id}
            onPress={() => {
              feedback('select');
              setSettings({ major: m.id });
            }}
            last={i === MAJORS.length - 1}
          />
        ))}
      </Group>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ body: { padding: 16, paddingHorizontal: SCREEN_GUTTER, gap: 22 } });
