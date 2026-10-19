import { formatRange, formatTime, toMinutes } from '@dayli/core';
import type { Item } from '@dayli/schema';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { T } from '@/components/Text';
import { useTheme } from '@/theme';

const PX_PER_HOUR = 28;

/**
 * The day by the hour: the Today bar opened up. Events are blocks, done ones green,
 * overlaps narrower in red, a now line across. Shows 8 am to midnight, or earlier if
 * something starts before 8.
 */
export function HourView({ items, now, conflicts, onPress }: { items: Item[]; now: { date: string; time: string }; conflicts: Set<string>; onPress?: (item: Item) => void }) {
  const { c, dark } = useTheme();
  const timed = items.filter((it) => it.start && it.date === now.date);
  const earliest = Math.min(8 * 60, ...timed.map((it) => toMinutes(it.start!)));
  const fromHour = Math.max(0, Math.floor(earliest / 60));
  const hours = 24 - fromHour;
  const height = hours * PX_PER_HOUR;
  const y = (t: string) => ((toMinutes(t) - fromHour * 60) / 60) * PX_PER_HOUR;
  const nowMin = toMinutes(now.time);
  const nowY = ((nowMin - fromHour * 60) / 60) * PX_PER_HOUR;
  const label = (h: number) => (h === 12 ? 'noon' : h === 0 || h === 24 ? '12' : h === fromHour || h === 8 ? `${h % 12 || 12} ${h < 12 ? 'am' : 'pm'}` : h > 12 ? `${h - 12}` : `${h}`);

  return (
    <View style={{ height, position: 'relative' }} accessible accessibilityRole="image"
      accessibilityLabel={`${now.date} by the hour, ${timed.length} ${timed.length === 1 ? 'thing' : 'things'}`}>
      {Array.from({ length: Math.floor(hours / 2) + 1 }, (_, i) => fromHour + i * 2).map((h) => (
        <View key={h} style={[styles.hour, { top: (h - fromHour) * PX_PER_HOUR }]}>
          <T token="caption" color={c.inkSecondary} tabular style={styles.hourLabel}>{label(h)}</T>
          <View style={[styles.rule, { backgroundColor: c.line }]} />
        </View>
      ))}
      {timed.map((it) => {
        const top = y(it.start!);
        const end = it.kind === 'event' && it.end ? y(it.end < it.start! ? '24:00' : it.end) : top + PX_PER_HOUR * 0.75;
        const h = Math.max(22, end - top);
        const conflict = conflicts.has(it.id);
        const past = it.done || (it.end ? toMinutes(it.end) <= nowMin : toMinutes(it.start!) + 60 <= nowMin);
        const bg = conflict ? c.row : past ? c.addedBg : it.kind === 'task' ? c.row : c.inkPrimary;
        const ink = conflict ? c.conflict : past ? c.added : it.kind === 'task' ? c.inkPrimary : c.onPrimary;
        const sub = it.kind === 'event' && it.end ? formatRange(it.start!, it.end) : formatTime(it.start!);
        return (
          <Pressable key={it.id} onPress={() => onPress?.(it)} accessibilityRole="button" accessibilityLabel={`${it.title}, ${sub}${conflict ? ', overlaps something else' : ''}`}
            style={({ pressed }) => [styles.block, { top, height: h, left: conflict ? '50%' : 48, backgroundColor: bg, opacity: pressed ? 0.7 : 1 }]}>
            <View style={styles.blockText}>
              {past && it.kind === 'event' ? <Icon name="tick" size={12} color={ink} strokeWidth={2.5} /> : null}
              <T token="subhead" color={ink} numberOfLines={1} style={{ fontSize: 12, lineHeight: 16 }}>{it.title}{h < 40 ? ` · ${sub}` : ''}{conflict ? ' · overlaps' : ''}</T>
            </View>
            {h >= 40 ? <T token="caption" color={conflict ? c.conflict : past ? c.added : it.kind === 'task' ? c.inkSecondary : dark ? '#686963' : '#B4B4AC'} numberOfLines={1}>{sub}{it.employer ? ` · ${it.employer}` : ''}</T> : null}
          </Pressable>
        );
      })}
      {nowMin >= fromHour * 60 && nowMin <= 24 * 60 ? (
        <>
          <View style={[styles.nowLine, { top: nowY, backgroundColor: c.inkPrimary }]} />
          <View style={[styles.nowDot, { top: nowY - 3, backgroundColor: c.inkPrimary }]} />
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
  block: { position: 'absolute', right: 0, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, justifyContent: 'center', gap: 2, overflow: 'hidden' },
  blockText: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nowLine: { position: 'absolute', left: 40, right: 0, height: 1.5 },
  nowDot: { position: 'absolute', left: 37, width: 7, height: 7, borderRadius: 4 },
  nowLabel: { position: 'absolute', left: 0, width: 34, textAlign: 'right', fontSize: 11, lineHeight: 14, fontFamily: undefined },
});
