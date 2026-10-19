import { toMinutes } from '@dayli/core';
import type { Item } from '@dayli/schema';
import { StyleSheet, View } from 'react-native';

import { T } from '@/components/Text';
import { useTheme } from '@/theme';

const START = 6 * 60;
const END = 24 * 60;
const SPAN = END - START;

/**
 * The day as a bar, 6 am to midnight: green for what is done, ink for what is booked,
 * red where two things overlap, and a hairline for now. Semli's chart.
 */
export function DayBar({ items, now, conflicts }: { items: Item[]; now: { date: string; time: string }; conflicts: Set<string> }) {
  const { c } = useTheme();
  const nowMin = toMinutes(now.time);
  const blocks = items
    .filter((it) => it.kind === 'event' && it.start && it.date === now.date)
    .map((it) => {
      const s = Math.max(START, toMinutes(it.start!));
      const e = Math.min(END, it.end ? Math.max(toMinutes(it.end), s + 15) : s + 60);
      const past = e <= nowMin || it.done;
      const color = conflicts.has(it.id) ? c.conflict : past ? c.added : c.inkPrimary;
      return { id: it.id, left: ((s - START) / SPAN) * 100, width: ((e - s) / SPAN) * 100, color };
    })
    .filter((b) => b.width > 0);
  const nowLeft = Math.min(100, Math.max(0, ((nowMin - START) / SPAN) * 100));
  return (
    <View style={styles.wrap} accessible accessibilityLabel={`Day timeline, ${blocks.length} ${blocks.length === 1 ? 'block' : 'blocks'} today`}>
      <View style={[styles.track, { backgroundColor: c.row }]}>
        {blocks.map((b) => (
          <View key={b.id} style={[styles.block, { left: `${b.left}%`, width: `${b.width}%`, backgroundColor: b.color }]} />
        ))}
        {nowMin >= START && nowMin <= END ? <View style={[styles.now, { left: `${nowLeft}%`, backgroundColor: c.inkPrimary }]} /> : null}
      </View>
      <View style={styles.labels}>
        {['6 am', 'noon', '6 pm', 'midnight'].map((l) => (
          <T key={l} token="caption" color={c.inkSecondary} tabular style={{ fontSize: 11, lineHeight: 14 }}>{l}</T>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  track: { height: 6, borderRadius: 3, position: 'relative' },
  block: { position: 'absolute', top: 0, height: 6, borderRadius: 3 },
  now: { position: 'absolute', top: -5, width: 1.5, height: 16 },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
});
