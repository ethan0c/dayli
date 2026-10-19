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
 * With `highlight`, that item is ink and everything else is grey: the day around it.
 */
export function DayBar({ items, now, conflicts, highlight, labels = true }: {
  items: Item[]; now: { date: string; time: string }; conflicts: Set<string>; highlight?: string; labels?: boolean;
}) {
  const { c } = useTheme();
  const nowMin = toMinutes(now.time);
  const blocks = items
    .filter((it) => it.kind === 'event' && it.start && it.date === now.date)
    .map((it) => {
      const s = Math.max(START, toMinutes(it.start!));
      const e = Math.min(END, it.end ? Math.max(toMinutes(it.end), s + 15) : s + 60);
      const past = e <= nowMin || it.done;
      const color = highlight
        ? it.id === highlight ? c.inkPrimary : c.controlOutline
        : conflicts.has(it.id) ? c.conflict : past ? c.added : c.inkPrimary;
      return { id: it.id, left: ((s - START) / SPAN) * 100, width: ((e - s) / SPAN) * 100, color, dim: highlight ? it.id !== highlight : false };
    })
    .filter((b) => b.width > 0)
    .sort((a, b) => Number(!a.dim) - Number(!b.dim));
  const nowLeft = Math.min(100, Math.max(0, ((nowMin - START) / SPAN) * 100));
  return (
    <View style={styles.wrap} accessible accessibilityLabel={`Day timeline, ${blocks.length} ${blocks.length === 1 ? 'block' : 'blocks'}`}>
      <View style={[styles.track, { backgroundColor: c.row }]}>
        {blocks.map((b) => (
          <View key={b.id} style={[styles.block, { left: `${b.left}%`, width: `${b.width}%`, backgroundColor: b.color, opacity: b.dim ? 0.5 : 1 }]} />
        ))}
        {!highlight && nowMin >= START && nowMin <= END ? <View style={[styles.now, { left: `${nowLeft}%`, backgroundColor: c.inkPrimary }]} /> : null}
      </View>
      {labels ? (
        <View style={styles.labels}>
          {['6 am', 'noon', '6 pm', 'midnight'].map((l) => (
            <T key={l} token="caption" color={c.inkSecondary} tabular style={{ fontSize: 11, lineHeight: 14 }}>{l}</T>
          ))}
        </View>
      ) : null}
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
