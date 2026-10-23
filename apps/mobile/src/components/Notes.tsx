import { parseNotes, toggleNoteCheck, type NoteInline } from '@dayli/core';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { openLink } from '@/lib/links';
import { corner, mobileFonts, radius, useTheme, space } from '@/theme';

/**
 * A note, read like a small Markdown file: headings, lists, ticks you can tap, bold, links.
 * Tapping the text opens the editor; tapping a tick flips it in the text without opening it.
 */
export function Notes({ text, onChange, onEdit }: { text: string; onChange: (next: string) => void; onEdit: () => void }) {
  const { c } = useTheme();
  const blocks = parseNotes(text);
  const inline = (parts: NoteInline[], color = c.inkPrimary, strike = false) => parts.map((part, i) =>
    part.kind === 'bold' ? <T key={i} token="body" color={color} style={{ fontFamily: mobileFonts.medium }}>{part.text}</T>
    : part.kind === 'link' ? <T key={i} token="body" color={color} style={styles.link} onPress={() => { feedback('tap'); void openLink(part.text.startsWith('http') ? part.text : `https://${part.text}`); }} accessibilityRole="link">{part.text}</T>
    : <T key={i} token="body" color={color} style={strike ? styles.done : undefined}>{part.text}</T>);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Notes, tap to edit" onPress={onEdit} style={styles.root}>
      {blocks.map((b) => {
        if (b.kind === 'blank') return <View key={b.line} style={styles.blank} />;
        if (b.kind === 'heading') return <T key={b.line} token={b.level === 1 ? 'title' : 'headline'} style={styles.heading}>{inline(b.inline)}</T>;
        if (b.kind === 'check') return (
          <Pressable key={b.line} accessibilityRole="checkbox" accessibilityState={{ checked: b.done }} style={styles.row}
            onPress={() => { feedback(b.done ? 'uncomplete' : 'complete'); onChange(toggleNoteCheck(text, b.line)); }}>
            <View style={[styles.box, { borderColor: b.done ? c.inkPrimary : c.inkSecondary, backgroundColor: b.done ? c.inkPrimary : 'transparent' }]}>
              {b.done ? <Icon name="tick" size={12} color={c.onPrimary} strokeWidth={2.5} /> : null}
            </View>
            <T token="body" style={{ flex: 1 }} color={b.done ? c.inkSecondary : c.inkPrimary}>{inline(b.inline, b.done ? c.inkSecondary : c.inkPrimary, b.done)}</T>
          </Pressable>
        );
        if (b.kind === 'bullet') return (
          <View key={b.line} style={styles.row}>
            {b.ordinal !== null ? <T token="body" color={c.inkSecondary} tabular style={styles.marker}>{`${b.ordinal}.`}</T> : <View style={[styles.dot, { backgroundColor: c.inkPrimary }]} />}
            <T token="body" style={{ flex: 1 }}>{inline(b.inline)}</T>
          </View>
        );
        return <T key={b.line} token="body">{inline(b.inline)}</T>;
      })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.xxs },
  blank: { height: 8 },
  heading: { paddingTop: space.xxs },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, minHeight: 28, paddingVertical: space.hair },
  box: { width: 18, height: 18, ...corner(radius.mark), borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: space.sm, marginLeft: space.snug, marginRight: 7 },
  marker: { minWidth: 18, textAlign: 'right' },
  link: { textDecorationLine: 'underline' },
  done: { textDecorationLine: 'line-through' },
});
