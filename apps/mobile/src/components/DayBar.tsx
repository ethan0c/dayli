import { dayNumber, eventInterval, findConflicts, intervalOf, toMinutes } from '@dayli/core';
import type { Item } from '@dayli/schema';
import { chart } from '@dayli/tokens';
import { StyleSheet, View } from 'react-native';

import { NowLine } from '@/components/ChartMark';
import { T } from '@/components/Text';
import { useTheme } from '@/theme';

const START = 6 * 60;
const END = 24 * 60;
const SPAN = END - START;
/** The empty track: 14% of the ink, as hex alpha. */
const TRACK_ALPHA = '24';
const AXIS = (['6 am', 'Noon', '6 pm', 'Midnight'] as const).map((l, i) => [l, (i * 6 * 60 / SPAN) * 100] as const);

/**
 * The day as a bar, 6 am to midnight: green for what is done, ink for what is booked,
 * red where two things overlap, and a hairline for now. Semli's chart.
 * With `highlight`, that item is ink and everything else grey; overlaps stay red.
 */
export function DayBar({ items, now, conflicts, highlight, labels = true }: {
  items: Item[]; now: { date: string; time: string }; conflicts: Set<string>; highlight?: string; labels?: boolean;
}) {
  const { c } = useTheme();
  const nowMin = toMinutes(now.time);
  const base = dayNumber(now.date) * 1440;
  const blocks = items
    .filter((it) => it.kind === 'event' && it.start)
    .map((it) => {
      const iv = intervalOf(it);
      const start = iv ? iv.start - base : (dayNumber(it.date) - dayNumber(now.date)) * 1440 + toMinutes(it.start!);
      const s = Math.max(START, start);
      const e = Math.min(END, iv ? iv.end - base : start + 60);
      const past = e <= nowMin || it.done;
      const color = highlight
        ? it.id === highlight ? c.chartBooked : c.controlOutline
        : past ? c.added : c.chartBooked;
      return { id: it.id, left: ((s - START) / SPAN) * 100, width: ((e - s) / SPAN) * 100, color, dim: highlight ? it.id !== highlight : false };
    })
    .filter((b) => b.width > 0)
    .sort((a, b) => Number(!a.dim) - Number(!b.dim));
  const overlaps = findConflicts(items).filter((pair) => conflicts.has(pair.a) || conflicts.has(pair.b)).flatMap((pair) => {
    const a = eventInterval(items.find((it) => it.id === pair.a)!)!;
    const b = eventInterval(items.find((it) => it.id === pair.b)!)!;
    const start = Math.max(START, Math.max(a.start, b.start) - base);
    const end = Math.min(END, Math.min(a.end, b.end) - base);
    return end > start ? [{ id: `${pair.a}:${pair.b}`, left: (start - START) / SPAN * 100, width: (end - start) / SPAN * 100 }] : [];
  });
  const nowLeft = Math.min(100, Math.max(0, ((nowMin - START) / SPAN) * 100));
  return (
    <View style={styles.wrap} accessible accessibilityLabel={`Day timeline, ${blocks.length} ${blocks.length === 1 ? 'block' : 'blocks'}, ${overlaps.length} ${overlaps.length === 1 ? 'overlap' : 'overlaps'}`}>
      {/* Ink at low alpha, not the row grey: Today's bar sits on the sky, and a tint reads on cloud and paper alike. */}
      <View style={[styles.track, { backgroundColor: `${c.inkPrimary}${TRACK_ALPHA}` }]}>
        {blocks.map((b) => (
          <View key={b.id} style={[styles.block, { left: `${b.left}%`, width: `${b.width}%`, backgroundColor: b.color, opacity: b.dim ? 0.5 : 1 }]} />
        ))}
        {overlaps.map((span) => <View key={span.id} style={[styles.block, { left: `${span.left}%`, width: `${span.width}%`, backgroundColor: c.conflict }]} />)}
        {!highlight && nowMin >= START && nowMin <= END ? <NowLine at={{ x: nowLeft }} color={c.inkPrimary} /> : null}
      </View>
      {labels ? (
        <View style={styles.labels}>
          {/* Each label sits on its hour: the ends align to the bar's ends, Noon and 6 pm centre on theirs. */}
          {AXIS.map(([l, p]) => (
            <T key={l} token="caption" color={c.inkSecondary} tabular
              style={[styles.label, p === 0 ? { left: 0 } : p === 100 ? { right: 0 } : { left: `${p}%`, width: 60, marginLeft: -30, textAlign: 'center' }]}>{l}</T>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  track: { height: chart.track, borderRadius: chart.track / 2, position: 'relative' },
  block: { position: 'absolute', top: 0, height: chart.track, borderRadius: chart.track / 2 },
  labels: { position: 'relative', height: 14 },
  label: { position: 'absolute', fontSize: 11, lineHeight: 14 },
});
