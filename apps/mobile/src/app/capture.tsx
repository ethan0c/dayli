import { localParts } from '@dayli/core';
import { IMPORT_MESSAGES, type ExtractRequest } from '@dayli/schema';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon, type IconKey } from '@/components/Icon';
import { Reading } from '@/components/Reading';
import { Button, Sheet } from '@/components/Sheet';
import { T } from '@/components/Text';
import { requestExtraction } from '@/lib/api';
import { feedback } from '@/lib/feedback';
import { useStore } from '@/store';
import { radius, textStyle, useTheme } from '@/theme';

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;
type ImageType = (typeof IMAGE_TYPES)[number];
const MAX_BYTES = 20 * 1024 * 1024;

export default function CaptureScreen() {
  const { c } = useTheme();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setErrorText] = useState<string | null>(null);
  const setError = (message: string | null) => {
    if (message) feedback('error');
    setErrorText(message);
  };
  const settings = useStore((s) => s.settings);
  const courses = useStore((s) => s.courses);
  const schedules = useStore((s) => s.schedules);
  const setPending = useStore((s) => s.setPending);
  const recordImport = useStore((s) => s.recordImport);

  async function run(input: ExtractRequest['input'], source: string) {
    setError(null);
    setBusy(source);
    const res = await requestExtraction(settings.apiUrl, {
      input,
      context: {
        today: localParts(new Date()).date,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        courses: courses.map((k) => ({ code: k.code, title: k.title })),
        employers: [...new Set(schedules.map((s) => s.employer))],
      },
    });
    setBusy(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (res.extraction.items.length === 0) {
      setError(IMPORT_MESSAGES.empty);
      return;
    }
    feedback('ready');
    recordImport();
    setPending({ extraction: res.extraction, source });
    router.replace('/review');
  }

  async function pickImage(fromCamera: boolean) {
    setError(null);
    try {
      const perm = fromCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setError(fromCamera
          ? 'To take a photo, allow Dayli to use your camera in your device settings. You can also type the details instead.'
          : 'To choose a screenshot, allow Dayli to access your photos in your device settings. You can also type the details instead.');
        return;
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.85 };
      const result = fromCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) return;
      if (asset.fileSize && asset.fileSize > MAX_BYTES) {
        setError(IMPORT_MESSAGES.tooLarge);
        return;
      }
      const file = new File(asset.uri);
      const data = await file.base64();
      const guess = asset.mimeType ?? (asset.uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
      const mediaType = (IMAGE_TYPES as readonly string[]).includes(guess) ? (guess as ImageType) : 'image/jpeg';
      await run({ kind: 'image', mediaType, data }, fromCamera ? 'Photo' : 'Screenshot');
    } catch {
      setError("We couldn't open this photo. Try choosing it again, or type the details instead.");
    }
  }

  async function pickPdf() {
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) return;
      if (asset.size && asset.size > MAX_BYTES) {
        setError(IMPORT_MESSAGES.tooLarge);
        return;
      }
      const data = await new File(asset.uri).base64();
      await run({ kind: 'pdf', data }, asset.name);
    } catch {
      setError(IMPORT_MESSAGES.file);
    }
  }

  const canSend = text.trim().length > 0 && !busy;

  return (
    <Sheet title="Tell Dayli" subtitle="A message, a screenshot, or a syllabus. Nothing is saved until you confirm.">
      <View style={styles.body}>
        <TextInput
          id="capture-text"
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
          editable={!busy}
          placeholder="I work Friday 4–10, have an exam Monday, and need to buy scrubs Wednesday…"
          placeholderTextColor={c.inkTertiary}
          style={[styles.input, textStyle('body', c.inkPrimary), { backgroundColor: c.row }]}
        />

        <View style={styles.actions}>
          <Action icon="image" label="Screenshot" onPress={() => pickImage(false)} disabled={!!busy} />
          <Action icon="camera" label="Camera" onPress={() => pickImage(true)} disabled={!!busy} />
          <Action icon="file" label="PDF" onPress={pickPdf} disabled={!!busy} />
        </View>

        {busy ? <Reading source={busy === 'Message' ? 'your message' : busy} /> : null}
        {error ? (
          <View accessibilityRole="alert" style={[styles.status, { backgroundColor: c.conflictBg, borderColor: 'transparent' }]}>
            <Icon name="alert" size={16} color={c.conflict} />
            <T token="subhead" color={c.conflict} style={{ flex: 1 }}>
              {error}
            </T>
          </View>
        ) : null}
      </View>
      <View style={styles.footer}>
        <Button label="Review what Dayli finds" disabled={!canSend} onPress={() => run({ kind: 'text', text: text.trim() }, 'Message')} />
      </View>
    </Sheet>
  );
}

function Action({ icon, label, onPress, disabled }: { icon: IconKey; label: string; onPress: () => void; disabled: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={() => {
        feedback('tap');
        onPress();
      }}
      disabled={disabled}
      style={({ pressed }) => [styles.action, { backgroundColor: c.row, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }]}>
      <Icon name={icon} size={20} color={c.inkPrimary} />
      <T token="subhead">{label}</T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 20, gap: 12 },
  input: { minHeight: 120, maxHeight: 220, borderRadius: radius.card, padding: 16, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, height: 64, borderRadius: radius.row, alignItems: 'center', justifyContent: 'center', gap: 4 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.row, borderWidth: 1 },
  footer: { paddingHorizontal: 20, paddingVertical: 16 },
});
