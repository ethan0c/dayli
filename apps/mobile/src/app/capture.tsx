import { localParts } from '@dayli/core';
import { IMPORT_MESSAGES, type ExtractRequest } from '@dayli/schema';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams, useNavigation, type NativeStackNavigationProp } from 'expo-router';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Icon, type IconKey } from '@/components/Icon';
import { Reading } from '@/components/Reading';
import { Button, Sheet } from '@/components/Sheet';
import { T } from '@/components/Text';
import { track } from '@/lib/analytics';
import { requestExtraction } from '@/lib/api';
import { feedback } from '@/lib/feedback';
import { FREE_IMPORTS_PER_MONTH } from '@/lib/plans';
import { hasSemliPro, purchaseErrorMessage } from '@/lib/revenuecat';
import { usePurchases } from '@/providers/PurchasesProvider';
import { useCourseList, useScheduleList, useStore } from '@/store';
import { SCREEN_GUTTER, radius, textStyle, useTheme } from '@/theme';

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;
type ImageType = (typeof IMAGE_TYPES)[number];
const MAX_BYTES = 20 * 1024 * 1024;

export default function CaptureScreen() {
  const { c } = useTheme();
  const params = useLocalSearchParams<{ source?: string }>();
  const navigation = useNavigation<NativeStackNavigationProp<ReactNavigation.RootParamList>>();
  const { refreshCustomerInfo, presentPaywall } = usePurchases();
  const [text, setText] = useState(() => useStore.getState().captureDraft);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setErrorText] = useState<string | null>(null);
  const setError = (message: string | null) => {
    if (message) feedback('error');
    setErrorText(message);
  };
  const settings = useStore((s) => s.settings);
  const courses = useCourseList();
  const schedules = useScheduleList();
  const setPending = useStore((s) => s.setPending);
  const recordImport = useStore((s) => s.recordImport);

  async function run(input: ExtractRequest['input'], source: string) {
    setError(null);
    setBusy(source);
    track('import_started', { kind: input.kind });
    const usage = useStore.getState().usage;
    const month = new Date().toISOString().slice(0, 7);
    if (usage.month === month && usage.imports >= FREE_IMPORTS_PER_MONTH) {
      try {
        const info = await refreshCustomerInfo();
        track('paywall_shown', { reason: 'quota' });
        if (!hasSemliPro(info) && !(await presentPaywall())) {
          setBusy(null);
          return;
        }
      } catch (failure) {
        setError(purchaseErrorMessage(failure));
        setBusy(null);
        return;
      }
    }
    try {
      const res = await requestExtraction(settings.apiUrl, {
        input,
        context: {
          name: settings.name,
          today: localParts(new Date()).date,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          courses: courses.map((k) => ({ code: k.code, title: k.title })),
          employers: [...new Set(schedules.map((s) => s.employer))],
        },
      });
      if (!res.ok) {
        track('import_failed', { kind: input.kind });
        setError(res.error);
        return;
      }
      if (res.extraction.items.length === 0) {
        setError(IMPORT_MESSAGES.empty);
        return;
      }
      feedback('ready');
      useStore.getState().setCaptureDraft('');
      recordImport();
      track('import_succeeded', { kind: input.kind, items: res.extraction.items.length, type: res.extraction.detected_type });
      setPending({ extraction: res.extraction, source });
      router.replace('/review');
    } catch {
      setError(IMPORT_MESSAGES.unavailable);
    } finally {
      setBusy(null);
    }
  }

  async function pickImage(fromCamera: boolean) {
    setError(null);
    try {
      const perm = fromCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setError(fromCamera
          ? 'To take a photo, allow Semli to use your camera in your device settings. You can also type the details instead.'
          : 'To choose a screenshot, allow Semli to access your photos in your device settings. You can also type the details instead.');
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

  // A photo/file button on Today should open its picker directly, once per request.
  const openedSource = useRef<string | null>(null);
  const openSource = useEffectEvent((source: string) => {
    if (openedSource.current === source) return;
    openedSource.current = source;
    if (source === 'image') void pickImage(false);
    if (source === 'file') void pickPdf();
  });
  useEffect(() => {
    if (!params.source) return;
    if (Platform.OS === 'web') {
      // Browser pickers require another explicit user gesture on the capture screen.
      return;
    }
    // iOS cannot present its picker while the capture modal is still opening.
    return navigation.addListener('transitionEnd', (event) => {
      if (!event.data.closing && params.source) openSource(params.source);
    });
  }, [navigation, params.source]);

  return (
    <Sheet title="Add anything." subtitle="A thought, a schedule, a whole syllabus. You review the details before anything is added.">
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <TextInput
          id="capture-text"
          accessibilityLabel="What would you like to add?"
          value={text}
          onChangeText={(value) => { setText(value); useStore.getState().setCaptureDraft(value); }}
          multiline
          autoFocus={!params.source}
          editable={!busy}
          placeholder="I work Friday 4–10, have an exam Monday, and need to return a library book Wednesday…"
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
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Review what Semli finds" disabled={!canSend} onPress={() => run({ kind: 'text', text: text.trim() }, 'Message')} />
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
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.action, { backgroundColor: c.row, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }]}>
      <Icon name={icon} size={20} color={c.inkPrimary} />
      <T token="subhead">{label}</T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: SCREEN_GUTTER, paddingBottom: 16, gap: 16 },
  input: { minHeight: 160, maxHeight: 260, borderRadius: radius.card, padding: 18, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, minHeight: 64, paddingVertical: 12, borderRadius: radius.row, alignItems: 'center', justifyContent: 'center', gap: 6 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.row, borderWidth: 1 },
  footer: { paddingHorizontal: SCREEN_GUTTER, paddingVertical: 16 },
});
