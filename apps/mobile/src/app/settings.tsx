import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Wordmark } from '@/components/Wordmark';
import { Button, Sheet } from '@/components/Sheet';
import { T } from '@/components/Text';
import { useStore } from '@/store';
import { radius, textStyle, useTheme } from '@/theme';

export default function SettingsScreen() {
  const { c } = useTheme();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const batches = useStore((s) => s.batches);
  const undoBatch = useStore((s) => s.undoBatch);
  const loadSample = useStore((s) => s.loadSample);
  const clearAll = useStore((s) => s.clearAll);

  return (
    <Sheet title="You">
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Field label="Your name" value={settings.name} onChange={(name) => setSettings({ name })} placeholder="Maya" />
        <Field
          label="Dayli server"
          value={settings.apiUrl}
          onChange={(apiUrl) => setSettings({ apiUrl })}
          placeholder="http://192.168.1.10:3000"
          hint="Where the web app runs. On a real phone, use your computer's network address."
        />

        <T token="overline" color={c.inkSecondary} style={styles.ov}>
          Import history
        </T>
        {batches.length === 0 ? (
          <T token="callout" color={c.inkSecondary}>
            Nothing imported yet.
          </T>
        ) : (
          batches.slice(0, 20).map((b) => (
            <View key={b.id} style={[styles.batch, { backgroundColor: c.row, opacity: b.undone ? 0.5 : 1 }]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T numberOfLines={1} style={b.undone ? { textDecorationLine: 'line-through' } : null}>
                  {b.label}
                </T>
                <T token="caption" color={c.inkSecondary}>
                  {new Date(b.createdAt).toLocaleString()} · {b.changes.length} {b.changes.length === 1 ? 'change' : 'changes'}
                </T>
              </View>
              {!b.undone && b.changes.length > 0 ? (
                <Pressable onPress={() => undoBatch(b.id)} hitSlop={8} style={styles.undo}>
                  <Icon name="undo" size={14} color={c.inkPrimary} />
                  <T token="subhead">Undo</T>
                </Pressable>
              ) : null}
            </View>
          ))
        )}

        <T token="overline" color={c.inkSecondary} style={styles.ov}>
          Data
        </T>
        <Button variant="ghost" label="Load the sample week" onPress={loadSample} />
        <Button variant="ghost" label="Replay the intro" onPress={() => setSettings({ onboarded: false })} />
        <Button variant="ghost" label="Clear everything" onPress={clearAll} />
        <T token="caption" color={c.inkSecondary}>
          Everything is stored on this phone for now. Accounts and sync come later.
        </T>

        <View style={styles.about}>
          <Wordmark width={88} ink={c.inkPrimary} />
          <T token="caption" color={c.inkSecondary}>
            Dayli 0.1 · Your life, already organized.
          </T>
        </View>
      </ScrollView>
    </Sheet>
  );
}

function Field({ label, value, onChange, placeholder, hint }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; hint?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <T token="overline" color={c.inkSecondary} style={{ paddingLeft: 4 }}>
        {label}
      </T>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.inkTertiary}
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.input, textStyle('body', c.inkPrimary), { backgroundColor: c.row }]}
      />
      {hint ? (
        <T token="caption" color={c.inkSecondary} style={{ paddingLeft: 4 }}>
          {hint}
        </T>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  ov: { paddingLeft: 4, paddingTop: 12 },
  input: { height: 48, borderRadius: radius.row, paddingHorizontal: 14 },
  batch: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.row },
  undo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  about: { alignItems: 'center', gap: 8, paddingTop: 24 },
});
