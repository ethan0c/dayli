import { forwardRef, type ComponentRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { IconButton } from '@/components/Controls';
import { textStyle, useTheme } from '@/theme';

/**
 * The Add composer: a white rounded rectangle with the attachments inside it and an ink send
 * circle. Shared by the Add screen and the "Now, your week" onboarding step.
 */
export const Composer = forwardRef<ComponentRef<typeof TextInput>, {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  busy?: boolean;
  canSend: boolean;
  autoFocus?: boolean;
  onPickImage: () => void;
  onCamera: () => void;
  onPickPdf: () => void;
  onSend: () => void;
  id?: string;
}>(function Composer({ value, onChangeText, placeholder, busy, canSend, autoFocus, onPickImage, onCamera, onPickPdf, onSend, id }, ref) {
  const { c } = useTheme();
  return (
    <View style={[styles.composer, { backgroundColor: c.surface, borderColor: c.line }]}>
      <TextInput
        ref={ref}
        id={id}
        accessibilityLabel="What would you like to add?"
        value={value}
        onChangeText={onChangeText}
        multiline
        autoFocus={autoFocus}
        editable={!busy}
        placeholder={placeholder ?? 'Clinical Tuesday 7–3, pharm exam next Friday, working Sat 4–10…'}
        placeholderTextColor={c.inkTertiary}
        style={[styles.input, textStyle('body', c.inkPrimary)]}
      />
      <View style={styles.toolbar}>
        <IconButton icon="image" label="Add a screenshot" tone="bare" size={40} disabled={busy} onPress={onPickImage} />
        <IconButton icon="camera" label="Take a photo" tone="bare" size={40} disabled={busy} onPress={onCamera} />
        <IconButton icon="file" label="Add a PDF" tone="bare" size={40} disabled={busy} onPress={onPickPdf} />
        <View style={{ flex: 1 }} />
        <IconButton icon="send" label="Read it" tone="ink" size={40} disabled={!canSend} haptic="ready" onPress={onSend} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  composer: { borderRadius: 20, borderWidth: 1 },
  input: { minHeight: 112, maxHeight: 240, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, textAlignVertical: 'top' },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 8, paddingBottom: 8, paddingTop: 2 },
});
