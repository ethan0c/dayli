import { dateLocale, eventLanes, formatHour, formatRange, formatTime, toMinutes } from '@dayli/core';
import type { Item } from '@dayli/schema';
import { chart } from '@dayli/tokens';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { T } from '@/components/Text';
import { useTheme } from '@/theme';

const PX_PER_HOUR = 28;

/**
 * The day by the hour: the Today bar opened up. Events are blocks, done ones green,
 * overlaps side by side in terracotta, a now line across. Shows 8 am to midnight, or earlier if
 * something starts before 8.
 */
export function HourView({ items, now, conflicts, onPress }: { items: Item[]; now: { date: string; time: string }; conflicts: Set<string>; onPress?: (item: Item) => void }) {
  const { c } = useTheme();
  const timed = items.filter((it) => it.start && it.date === now.date);
  const lanes = eventLanes(timed);
  const earliest = Math.min(8 * 60, ...timed.map((it) => toMinutes(it.start!)));
  const fromHour = Math.max(0, Math.floor(earliest / 60));
  const hours = 24 - fromHour;
  const height = hours * PX_PER_HOUR;
  const y = (t: string) => ((toMinutes(t) - fromHour * 60) / 60) * PX_PER_HOUR;
  const nowMin = toMinutes(now.time);
  const nowY = ((nowMin - fromHour * 60) / 60) * PX_PER_HOUR;
  const showNow = nowMin >= fromHour * 60 && nowMin <= 24 * 60;
  const label = (h: number) => !dateLocale().hour12 ? formatHour(h) : (h === 12 ? 'Noon' : h === 0 || h === 24 ? '12' : h === fromHour || h === 8 ? `${h % 12 || 12} ${h < 12 ? 'am' : 'pm'}` : h > 12 ? `${h - 12}` : `${h}`);

  return (
    <View style={{ height, position: 'relative' }}>
      {Array.from({ length: Math.floor(hours / 2) + 1 }, (_, i) => fromHour + i * 2).map((h) => (
        <View key={h} style={[styles.hour, { top: (h - fromHour) * PX_PER_HOUR }]}>
          {/* The now time takes the gutter near it; the hour it would cover steps aside. */}
          <T token="caption" color={c.inkSecondary} tabular style={[styles.hourLabel, showNow && Math.abs((h - fromHour) * PX_PER_HOUR - nowY) < 14 ? { opacity: 0 } : null]}>{label(h)}</T>
          <View style={[styles.rule, { backgroundColor: c.line }]} />
        </View>
      ))}
      {/* Under the blocks, so the line never strikes through an event's title. */}
      {showNow ? <View style={[styles.nowLine, { top: nowY - chart.now / 2, backgroundColor: c.inkPrimary }]} /> : null}
      <View style={[StyleSheet.absoluteFill, { left: 48 }]} pointerEvents="box-none">
      {timed.map((it) => {
        const top = y(it.start!);
        const end = it.kind === 'event' && it.end ? y(it.end < it.start! ? '24:00' : it.end) : top + PX_PER_HOUR * 0.75;
        const h = Math.max(22, end - top);
        const conflict = conflicts.has(it.id);
        const past = it.done || (it.end ? toMinutes(it.end) <= nowMin : toMinutes(it.start!) + 60 <= nowMin);
        const bg = conflict ? c.conflict : past ? c.addedBg : it.kind === 'task' ? c.row : c.chartBooked;
        const ink = conflict ? c.onPrimary : past ? c.added : it.kind === 'task' ? c.inkPrimary : c.chartOnBooked;
        const sub = it.kind === 'event' && it.end ? formatRange(it.start!, it.end) : formatTime(it.start!);
        const column = lanes.get(it.id) ?? { lane: 0, lanes: 1 };
        const details = h >= 44;
        const overlapLine = conflict && h >= 64;
        return (
          <View key={it.id} pointerEvents="box-none" style={[styles.lane, { top, height: h, left: `${column.lane / column.lanes * 100}%`, width: `${100 / column.lanes}%`, paddingRight: column.lane < column.lanes - 1 ? 4 : 0 }]}>
            <Pressable onPress={() => onPress?.(it)} accessibilityRole="button" accessibilityLabel={`${it.title}, ${sub}${it.urgent ? ', urgent' : ''}${conflict ? ', overlaps something else' : ''}`}
              style={({ pressed }) => [styles.block, { backgroundColor: bg, paddingVertical: h < 28 ? 3 : 4, opacity: pressed ? 0.7 : 1 }]}>
              <View style={styles.blockText}>
                {past && it.kind === 'event' ? <Icon name="tick" size={12} color={ink} strokeWidth={2.5} /> : null}
                <T token="subhead" color={ink} numberOfLines={1} style={styles.blockTitle}>{it.urgent ? 'Urgent · ' : ''}{it.title}{!details ? ` · ${sub}` : ''}</T>
              </View>
              {details ? <T token="caption" color={conflict ? c.onPrimary : past ? c.added : it.kind === 'task' ? c.inkSecondary : c.chartOnBooked} numberOfLines={1}>{sub}{conflict && !overlapLine ? ' · Overlaps' : it.employer ? ` · ${it.employer}` : ''}</T> : null}
              {overlapLine ? <T token="caption" color={c.onPrimary}>Overlaps</T> : null}
            </Pressable>
          </View>
        );
      })}
      </View>
      {showNow ? (
        <>
          <View style={[styles.nowDot, { top: nowY - chart.nowDot / 2, backgroundColor: c.inkPrimary }]} />
          <T token="caption" color={c.inkPrimary} tabular style={[styles.nowLabel, { top: nowY - 7 }]}>{formatTime(now.time).replace(/ [ap]m$/, '')}</T>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hour: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  hourLabel: { width: 40, fontSize: 11, lineHeight: 14, marginTop: -7 },
  rule: { flex: 1, height: StyleSheet.hairlineWidth },
  lane: { position: 'absolute' },
  block: { flex: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, justifyContent: 'center', gap: 2, overflow: 'hidden' },
  blockText: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  blockTitle: { flexShrink: 1, fontSize: 12, lineHeight: 16 },
  nowLine: { position: 'absolute', left: 40, right: 0, height: chart.now },
  nowDot: { position: 'absolute', left: 40 - chart.nowDot / 2, width: chart.nowDot, height: chart.nowDot, borderRadius: chart.nowDot / 2 },
  nowLabel: { position: 'absolute', left: 0, width: 34, textAlign: 'right', fontSize: 11, lineHeight: 14, fontFamily: undefined },
});
