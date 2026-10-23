import { dateLocale, formatHour, formatRange, formatTime, hourLayout, hourScale, hourSpan, toMinutes, type HourSpan } from '@dayli/core';
import type { Item } from '@dayli/schema';
import { chart } from '@dayli/tokens';
import { Pressable, StyleSheet, View } from 'react-native';

import { bookedColors } from '@/components/ChartMark';
import { Icon } from '@/components/Icon';
import { T } from '@/components/Text';
import { corner, radius, useTheme } from '@/theme';

/** How the chart fits the day: at least six hours, about this tall, never cramped or stretched. */
const SCALE = { minSpan: 6, targetHeight: 560, minPx: 28, maxPx: 44 };
const BLOCKS = { gap: chart.blockGap, minHeight: chart.blockMin, fullAt: 40, titleAt: 16 };

/**
 * The day by the hour: the Today bar opened up. Events are blocks, done ones green, a now line
 * across. Blocks never touch or cover each other (`hourLayout` in core): back-to-back ones keep a
 * seam, a short one never grows into the next, and only times that truly cross sit side by side,
 * in red. The chart runs from an hour before the first thing to an hour after the last.
 */
export function HourView({ items, now, conflicts, onPress }: { items: Item[]; now: { date: string; time: string }; conflicts: Set<string>; onPress?: (item: Item) => void }) {
  const { c } = useTheme();
  const timed = items.filter((it) => it.start && it.date === now.date);
  const spans = timed.map(hourSpan).filter((x): x is HourSpan => x !== null);
  const scale = hourScale(spans, SCALE);
  const { fromHour, toHour, pxPerHour: PX_PER_HOUR } = scale;
  const blocks = new Map(hourLayout(spans, scale, BLOCKS).map((b) => [b.id, b]));
  const hours = toHour - fromHour;
  const height = hours * PX_PER_HOUR;
  const nowMin = toMinutes(now.time);
  const nowY = ((nowMin - fromHour * 60) / 60) * PX_PER_HOUR;
  const showNow = nowMin >= fromHour * 60 && nowMin <= toHour * 60;
  const step = PX_PER_HOUR >= 40 ? 1 : 2;
  // Too short to hold their own title: named under the chart instead of on it.
  const bars = timed.filter((it) => blocks.get(it.id)?.size === 'bar');
  const label = (h: number) => !dateLocale().hour12 ? formatHour(h) : (h === 12 ? 'Noon' : h === 0 || h === 24 ? '12' : h === fromHour || h === 8 ? `${h % 12 || 12} ${h < 12 ? 'am' : 'pm'}` : h > 12 ? `${h - 12}` : `${h}`);

  return (
    <View>
    <View style={{ height, position: 'relative' }}>
      {Array.from({ length: Math.floor(hours / step) + 1 }, (_, i) => fromHour + i * step).map((h) => (
        <View key={h} style={[styles.hour, { top: (h - fromHour) * PX_PER_HOUR }]}>
          {/* The now time takes the gutter near it; the hour it would cover steps aside. */}
          <T token="axis" color={c.inkSecondary} tabular style={[styles.hourLabel, showNow && Math.abs((h - fromHour) * PX_PER_HOUR - nowY) < 14 ? { opacity: 0 } : null]}>{label(h)}</T>
          <View style={[styles.rule, { backgroundColor: c.line }]} />
        </View>
      ))}
      {/* Under the blocks, so the line never strikes through an event's title. */}
      {showNow ? <View style={[styles.nowLine, { top: nowY - chart.now / 2, backgroundColor: c.inkPrimary }]} /> : null}
      <View style={[StyleSheet.absoluteFill, { left: 48 }]} pointerEvents="box-none">
      {timed.map((it) => {
        const block = blocks.get(it.id);
        if (!block) return null;
        const { top, height: h, size } = block;
        const conflict = conflicts.has(it.id);
        // Green only for what was marked done; something that simply ended is quiet grey, never ticked.
        const past = !it.done && (it.end ? toMinutes(it.end) <= nowMin : toMinutes(it.start!) + 60 <= nowMin);
        const booked = bookedColors(it, c);
        const bg = conflict ? c.conflict : it.done ? c.addedBg : past || it.kind === 'task' ? c.row : booked.fill;
        const ink = conflict ? c.onPrimary : it.done ? c.added : past ? c.inkSecondary : it.kind === 'task' ? c.inkPrimary : booked.ink;
        const sub = it.kind === 'event' && it.end ? formatRange(it.start!, it.end) : formatTime(it.start!);
        const column = block;
        const details = size === 'full';
        const overlapLine = conflict && h >= 64;
        return (
          <View key={it.id} pointerEvents="box-none" style={[styles.lane, { top, height: h, left: `${column.lane / column.lanes * 100}%`, width: `${100 / column.lanes}%`, paddingRight: column.lane < column.lanes - 1 ? 4 : 0 }]}>
            <Pressable onPress={() => onPress?.(it)} accessibilityRole="button" accessibilityLabel={`${it.title}, ${sub}${it.urgent ? ', urgent' : ''}${conflict ? ', overlaps something else' : ''}`}
              style={({ pressed }) => [styles.block, { backgroundColor: bg, paddingVertical: size === 'bar' ? 0 : h < 28 ? 2 : 4, borderRadius: Math.min(8, h / 2), opacity: pressed ? 0.7 : 1 }]}>
              {size === 'bar' ? null : <>
              <View style={styles.blockText}>
                {it.done && it.kind === 'event' ? <Icon name="tick" size={12} color={ink} strokeWidth={2.5} /> : null}
                <T token="subhead" color={ink} numberOfLines={1} style={styles.blockTitle}>{it.urgent ? 'Urgent · ' : ''}{it.title}</T>
              </View>
              {details ? <T token="caption" color={conflict ? c.onPrimary : it.done ? c.added : past || it.kind === 'task' ? c.inkSecondary : booked.ink} numberOfLines={1}>{sub}{conflict && !overlapLine ? ' · Overlaps' : it.employer ? ` · ${it.employer}` : ''}</T> : null}
              {overlapLine ? <T token="caption" color={c.onPrimary}>Overlaps</T> : null}
              </>}
            </Pressable>
          </View>
        );
      })}
      </View>
      {showNow ? (
        <>
          <View style={[styles.nowDot, { top: nowY - chart.nowDot / 2, backgroundColor: c.inkPrimary }]} />
          <T token="axis" color={c.inkPrimary} tabular style={[styles.nowLabel, { top: nowY - 7 }]}>{formatTime(now.time).replace(/ [ap]m$/, '')}</T>
        </>
      ) : null}
    </View>
    {bars.length ? (
      <T token="caption" color={c.inkSecondary} style={styles.also}>
        {`Also today: ${bars.map((it) => `${it.title} ${formatTime(it.start!, true)}`).join(' · ')}`}
      </T>
    ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hour: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  hourLabel: { width: 40, marginTop: -7 },
  rule: { flex: 1, height: StyleSheet.hairlineWidth },
  lane: { position: 'absolute' },
  also: { paddingTop: 8, paddingLeft: 48 },
  block: { flex: 1, ...corner(radius.small), paddingHorizontal: 10, paddingVertical: 4, justifyContent: 'center', gap: 2, overflow: 'hidden' },
  blockText: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  blockTitle: { flexShrink: 1, fontSize: 12, lineHeight: 16 },
  nowLine: { position: 'absolute', left: 40, right: 0, height: chart.now },
  nowDot: { position: 'absolute', left: 40 - chart.nowDot / 2, width: chart.nowDot, height: chart.nowDot, borderRadius: chart.nowDot / 2 },
  nowLabel: { position: 'absolute', left: 0, width: 34, textAlign: 'right' },
});
