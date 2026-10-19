import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { T } from '@/components/Text';
import { radius, textStyle, useTheme } from '@/theme';

export function HomeCaptureCard({ onCapture }: { onCapture: (text: string, source?: 'image' | 'file') => void }) {
  const { c } = useTheme();
  const [draft, setDraft] = useState('');
  return (
    <View style={[styles.card, { backgroundColor: c.accentSoft, borderColor: c.accentBorder }]}>
      <View style={{ gap: 6 }}>
        <T token="title">Your week starts here.</T>
        <T token="callout" color={c.inkSecondary}>Paste a schedule, drop a syllabus, or tell Semli what’s coming up.</T>
      </View>
      <TextInput
        accessibilityLabel="Tell Semli about your week"
        value={draft}
        onChangeText={setDraft}
        multiline
        placeholder="I work Friday 4–10 and have an exam Monday…"
        placeholderTextColor={c.inkSecondary}
        style={[styles.input, textStyle('body', c.inkPrimary), { backgroundColor: c.canvas }]}
      />
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={() => onCapture(draft, 'image')} style={styles.action}>
          <Icon name="image" color={c.accentInk} size={18} /><T token="subhead" color={c.accentInk}>Photo</T>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onCapture(draft, 'file')} style={styles.action}>
          <Icon name="file" color={c.accentInk} size={18} /><T token="subhead" color={c.accentInk}>File</T>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue with your message"
          accessibilityState={{ disabled: !draft.trim() }}
          disabled={!draft.trim()}
          onPress={() => onCapture(draft)}
          style={[styles.send, { backgroundColor: c.inkPrimary, opacity: draft.trim() ? 1 : 0.4 }]}>
          <Icon name="chevronRight" color={c.canvas} size={20} />
        </Pressable>
      </View>
      <T token="caption" color={c.inkSecondary}>You’ll review everything before it’s added.</T>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, borderRadius: radius.card, borderWidth: 1, gap: 16 },
  input: { minHeight: 100, maxHeight: 180, padding: 14, borderRadius: radius.row, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  action: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  send: { marginLeft: 'auto', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
