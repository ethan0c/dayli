import { IMPORT_MESSAGES, type ExtractRequest } from '@dayli/schema';
import { router, useLocalSearchParams, useNavigation, type NativeStackNavigationProp } from 'expo-router';
import { useEffect, useEffectEvent, useRef, useState, type ComponentRef } from 'react';
import { Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { GroupLabel, IconButton, ListRow } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { Reading } from '@/components/Reading';
import { Sheet } from '@/components/Sheet';
import { T } from '@/components/Text';
import { track } from '@/lib/analytics';
import { requestExtraction } from '@/lib/api';
import { InputError, extractionContext, pickImageInput, pickPdfInput } from '@/lib/capture-input';
import { feedback } from '@/lib/feedback';
import { FREE_IMPORTS_PER_MONTH } from '@/lib/plans';
import { hasSemliPro, purchaseErrorMessage } from '@/lib/revenuecat';
import { usePurchases } from '@/providers/PurchasesProvider';
import { useStore } from '@/store';
import { SCREEN_GUTTER, textStyle, useTheme } from '@/theme';

/**
 * Add: a composer with the attachments inside it, and two "start with" rows.
 * Reading shows a progress line and rows that fill in; no box, no spinner.
 */
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
  const apiUrl = useStore((s) => s.settings.apiUrl);
  const setPending = useStore((s) => s.setPending);
  const recordImport = useStore((s) => s.recordImport);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);

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
      const res = await requestExtraction(apiUrl, { input, context: extractionContext() });
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

  const pick = async (fn: () => Promise<{ input: ExtractRequest['input']; source: string } | null>) => {
    setError(null);
    try {
      const picked = await fn();
      if (picked) await run(picked.input, picked.source);
    } catch (e) {
      setError(e instanceof InputError ? e.message : IMPORT_MESSAGES.file);
    }
  };

  const canSend = text.trim().length > 0 && !busy;

  // A photo/file button elsewhere should open its picker directly, once per request.
  const openedSource = useRef<string | null>(null);
  const openSource = useEffectEvent((source: string) => {
    if (openedSource.current === source) return;
    openedSource.current = source;
    if (source === 'image') void pick(() => pickImageInput(false));
    if (source === 'file') void pick(pickPdfInput);
  });
  useEffect(() => {
    if (!params.source) return;
    if (Platform.OS === 'web') return;
    return navigation.addListener('transitionEnd', (event) => {
      if (!event.data.closing && params.source) openSource(params.source);
    });
  }, [navigation, params.source]);

  return (
    <Sheet title="Add">
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {busy ? (
          <Reading source={busy === 'Message' ? 'your message' : busy} />
        ) : (
          <View style={{ gap: 4 }}>
            <T token="display">What’s coming up?</T>
            <T token="callout" color={c.inkSecondary}>Type it, paste it, or drop in a screenshot. You review everything before it’s added.</T>
          </View>
        )}

        <View style={[styles.composer, { backgroundColor: c.surface, borderColor: c.line }]}>
          <TextInput
            ref={inputRef}
            id="capture-text"
            accessibilityLabel="What would you like to add?"
            value={text}
            onChangeText={(value) => { setText(value); useStore.getState().setCaptureDraft(value); }}
            multiline
            autoFocus={!params.source}
            editable={!busy}
            placeholder="Clinical Tuesday 7–3, pharm exam next Friday, working Sat 4–10…"
            placeholderTextColor={c.inkTertiary}
            style={[styles.input, textStyle('body', c.inkPrimary)]}
          />
          <View style={styles.toolbar}>
            <IconButton icon="image" label="Add a screenshot" tone="bare" size={40} disabled={!!busy} onPress={() => void pick(() => pickImageInput(false))} />
            <IconButton icon="camera" label="Take a photo" tone="bare" size={40} disabled={!!busy} onPress={() => void pick(() => pickImageInput(true))} />
            <IconButton icon="file" label="Add a PDF" tone="bare" size={40} disabled={!!busy} onPress={() => void pick(pickPdfInput)} />
            <View style={{ flex: 1 }} />
            <IconButton icon="send" label="Read it" tone="ink" size={40} disabled={!canSend} haptic="ready" onPress={() => void run({ kind: 'text', text: text.trim() }, 'Message')} />
          </View>
        </View>

        {error ? (
          <View accessibilityRole="alert" style={styles.status}>
            <Icon name="alert" size={16} color={c.conflict} />
            <T token="subhead" color={c.conflict} style={{ flex: 1 }}>{error}</T>
          </View>
        ) : null}

        {!busy ? (
          <View>
            <GroupLabel>Or start with</GroupLabel>
            <ListRow leading={<Icon name="file" size={20} color={c.inkPrimary} />} title="A syllabus" sub="Classes, exams and due dates for the whole term" onPress={() => void pick(pickPdfInput)} />
            <ListRow leading={<Icon name="work" size={20} color={c.inkPrimary} />} title="A work schedule" sub="A screenshot from the scheduling app or the group chat" onPress={() => void pick(() => pickImageInput(false))} />
            <ListRow leading={<Icon name="pen" size={20} color={c.inkPrimary} />} title="Something your professor said" sub="A quick message is all you need" last onPress={() => inputRef.current?.focus()} />
          </View>
        ) : null}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 4, paddingBottom: 24, gap: 20 },
  composer: { borderRadius: 20, borderWidth: 1 },
  input: { minHeight: 112, maxHeight: 240, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, textAlignVertical: 'top' },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 8, paddingBottom: 8, paddingTop: 2 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
});
