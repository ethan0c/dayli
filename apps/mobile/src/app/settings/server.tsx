import { ScrollView, StyleSheet } from 'react-native';

import { FieldRow, Group } from '@/components/Settings';
import { useStore } from '@/store';

export default function ServerScreen() {
  const apiUrl = useStore((s) => s.settings.apiUrl);
  const setSettings = useStore((s) => s.setSettings);
  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic">
      <Group
        title="Where Nowli reads your imports"
        footer="For local development, this is the address where the Nowli web app is running. On a real phone, use your computer's network address, for example http://192.168.1.10:3000. The TestFlight build will set this for you.">
        <FieldRow label="Address" value={apiUrl} onChange={(apiUrl) => setSettings({ apiUrl })} placeholder="http://localhost:3000" last />
      </Group>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ body: { padding: 16, gap: 22 } });
