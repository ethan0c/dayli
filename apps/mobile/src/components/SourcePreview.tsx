import type { ExtractRequest } from '@dayli/schema';
import { createElement, useEffect, useMemo } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

import { T } from '@/components/Text';
import { SCREEN_GUTTER, corner, radius, useTheme, space } from '@/theme';

/** A PDF's bytes as a page the browser can show; revoked when the preview goes. */
function useBlobUrl(base64: string | null, type: string): string | null {
  const url = useMemo(() => {
    if (!base64) return null;
    const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
    return URL.createObjectURL(new Blob([bytes], { type }));
  }, [base64, type]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
}

/**
 * What an import was read from, beside its results on a wide web window: the screenshot, the PDF
 * in the browser's own viewer, or the message as typed. The web only; the phone reviews results alone.
 */
export function SourcePreview({ input, source }: { input: ExtractRequest['input']; source: string }) {
  const { c } = useTheme();
  const pdf = useBlobUrl(input.kind === 'pdf' ? input.data : null, 'application/pdf');
  return (
    <View style={[styles.pane, { borderLeftColor: c.line }]}>
      <T token="caption" color={c.inkSecondary} numberOfLines={1} style={styles.label}>{input.kind === 'text' ? 'Your message' : source}</T>
      {input.kind === 'image' ? (
        <Image source={{ uri: `data:${input.mediaType};base64,${input.data}` }} resizeMode="contain" accessibilityLabel={`The screenshot Semli read: ${source}`}
          style={[styles.frame, { borderColor: c.line, backgroundColor: c.surface }]} />
      ) : input.kind === 'pdf' ? (
        <View style={[styles.frame, { borderColor: c.line }]}>
          {pdf ? createElement('iframe', { src: pdf, title: source, style: { border: 0, width: '100%', height: '100%', borderRadius: radius.field } }) : null}
        </View>
      ) : (
        <ScrollView style={[styles.frame, { borderColor: c.line, backgroundColor: c.surface }]} contentContainerStyle={{ padding: space.md }}>
          <T token="body">{input.text}</T>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pane: { flex: 1, borderLeftWidth: StyleSheet.hairlineWidth, paddingHorizontal: SCREEN_GUTTER, paddingTop: space.xl, paddingBottom: space.xl, gap: space.sm },
  label: { },
  frame: { flex: 1, borderWidth: StyleSheet.hairlineWidth, ...corner(radius.field), overflow: 'hidden' },
});
