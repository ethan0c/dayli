import { heardClauses } from '@dayli/core';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { GroupLabel } from '@/components/Controls';
import { T } from '@/components/Text';
import { enter, exit, layout } from '@/lib/motion';
import { mobileFonts, useTheme } from '@/theme';

/**
 * What the composer has heard so far: one row per clause that names a day or a time, rising in
 * as it is said. The cue words are set in Medium, nothing is coloured, and the label says
 * "Heard", because nothing here is added. The model reads it properly on send.
 */
export function Heard({ text }: { text: string }) {
  const { c } = useTheme();
  const rows = useMemo(() => heardClauses(text), [text]);
  if (!rows.length) return null;
  return (
    <Animated.View layout={layout} entering={enter.fade} exiting={exit.fade} style={styles.root}>
      <GroupLabel>Heard</GroupLabel>
      {rows.map((row, i) => (
        <Animated.View key={`${i}-${row.text}`} layout={layout} entering={enter.rise} exiting={exit.fade}
          style={[styles.row, i < rows.length - 1 ? { borderBottomColor: c.line, borderBottomWidth: StyleSheet.hairlineWidth } : null]}
          accessibilityLabel={`Heard: ${row.text}, ${row.label}`}>
          <View style={[styles.dot, { backgroundColor: c.inkPrimary }]} />
          <T token="body" style={{ flex: 1 }} numberOfLines={2}>{spans(row.text, row.cues)}</T>
          <T token="caption" color={c.inkSecondary} tabular>{row.label}</T>
        </Animated.View>
      ))}
      <T token="caption" color={c.inkSecondary} style={{ paddingTop: 6 }}>Send to review the dates and times before adding them.</T>
    </Animated.View>
  );
}

/** The clause with its cues in Medium: "Clinical **Tuesday** **7–3**". */
function spans(text: string, cues: { start: number; end: number }[]) {
  const out: (string | React.ReactElement)[] = [];
  let at = 0;
  cues.forEach((cue, i) => {
    if (cue.start > at) out.push(text.slice(at, cue.start));
    out.push(<T key={i} token="body" style={{ fontFamily: mobileFonts.medium }}>{text.slice(cue.start, cue.end)}</T>);
    at = cue.end;
  });
  if (at < text.length) out.push(text.slice(at));
  return out;
}

const styles = StyleSheet.create({
  root: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingVertical: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
