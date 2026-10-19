import { dayNumber } from '@dayli/core';
import { StyleSheet, View } from 'react-native';

import { T } from '@/components/Text';
import { useTheme } from '@/theme';

export type TermMark = {
  id: string;
  date: string;
  /** A ring is an exam; a dot is a due date. */
  kind: 'ring' | 'dot';
  tone?: 'ink' | 'red' | 'green';
  /** Shown under the line for the few that matter (exams). */
  label?: string;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * A span of time as one line with marks on it: the term in the syllabus review, the next
 * four weeks on School. Month or week labels above, a hairline for today, labels below.
 */
export function TermLine({ from, to, marks, today, scale = 'months', weekLabels, labels = true }: {
  from: string; to: string; marks: TermMark[]; today?: string; scale?: 'months' | 'weeks' | 'none'; weekLabels?: string[];
  /** The row under the line with "today" and the labelled marks; off for a compact strip. */
  labels?: boolean;
}) {
  const { c } = useTheme();
  const a = dayNumber(from);
  const span = Math.max(1, dayNumber(to) - a);
  const pct = (date: string) => Math.min(100, Math.max(0, ((dayNumber(date) - a) / span) * 100));
  const tones = { ink: c.chartBooked, red: c.conflict, green: c.added };
  const labelled = marks.filter((m) => m.label);
  return (
    <View style={{ gap: 8 }}>
      {scale === 'months' ? (
        <View style={styles.scale}>
          {monthSpans(from, to).map((m) => (
            <T key={m.key} token="caption" color={c.inkSecondary} style={[styles.scaleLabel, { width: `${m.pct}%` }]}>{m.label}</T>
          ))}
        </View>
      ) : scale === 'weeks' && weekLabels ? (
        <View style={styles.scale}>
          {weekLabels.map((l) => <T key={l} token="caption" color={c.inkSecondary} tabular style={[styles.scaleLabel, { flex: 1 }]}>{l}</T>)}
        </View>
      ) : null}
      <View style={[styles.track, { backgroundColor: c.row }]} accessible accessibilityRole="image" accessibilityLabel={`${marks.length} dates between ${from} and ${to}`}>
        {today && today >= from && today <= to ? <View style={[styles.now, { left: `${pct(today)}%`, backgroundColor: c.inkPrimary }]} /> : null}
        {marks.map((m) => {
          const color = tones[m.tone ?? 'ink'];
          return m.kind === 'ring'
            ? <View key={m.id} style={[styles.ring, { left: `${pct(m.date)}%`, borderColor: color, backgroundColor: c.surface }]} />
            : <View key={m.id} style={[styles.dot, { left: `${pct(m.date)}%`, backgroundColor: color }]} />;
        })}
      </View>
      {labels && (labelled.length || today) ? (
        <View style={styles.labels}>
          {today && today >= from && today <= to && pct(today) < 8 ? <T token="caption" color={c.inkSecondary} style={[styles.label, { left: 0 }]}>Today</T> : null}
          {labelled.map((m) => {
            const p = pct(m.date);
            const pos = p < 8 ? { left: 0 } : p > 92 ? { right: 0 } : { left: `${p}%` as const, marginLeft: -36, width: 72, textAlign: 'center' as const };
            return <T key={m.id} token="caption" color={c.inkSecondary} tabular style={[styles.label, pos]}>{m.label}</T>;
          })}
        </View>
      ) : null}
    </View>
  );
}

/** Month labels sized to the days each month contributes to the span. */
function monthSpans(from: string, to: string): { key: string; label: string; pct: number }[] {
  const out: { key: string; label: string; pct: number }[] = [];
  const total = Math.max(1, dayNumber(to) - dayNumber(from) + 1);
  let cursor = from;
  while (cursor <= to) {
    const [y, m] = cursor.split('-').map(Number);
    const lastOfMonth = new Date(y!, m!, 0).getDate();
    const endOfMonth = `${y}-${String(m).padStart(2, '0')}-${String(lastOfMonth).padStart(2, '0')}`;
    const end = endOfMonth < to ? endOfMonth : to;
    const days = dayNumber(end) - dayNumber(cursor) + 1;
    out.push({ key: `${y}-${m}`, label: MONTHS[m! - 1]!, pct: (days / total) * 100 });
    cursor = `${m === 12 ? y! + 1 : y}-${String(m === 12 ? 1 : m! + 1).padStart(2, '0')}-01`;
  }
  return out;
}

const styles = StyleSheet.create({
  scale: { flexDirection: 'row' },
  scaleLabel: { fontSize: 11, lineHeight: 14 },
  track: { height: 6, borderRadius: 3, position: 'relative' },
  now: { position: 'absolute', top: -5, width: 1.5, height: 16, marginLeft: -0.75 },
  ring: { position: 'absolute', top: -3, width: 12, height: 12, marginLeft: -6, borderRadius: 6, borderWidth: 2 },
  dot: { position: 'absolute', top: -1, width: 8, height: 8, marginLeft: -4, borderRadius: 4 },
  labels: { position: 'relative', height: 16 },
  label: { position: 'absolute', fontSize: 11, lineHeight: 14 },
});
