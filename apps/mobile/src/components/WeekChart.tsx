import { mergeMarks, monthDay, toMinutes, weekdayShort } from '@dayli/core';
import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { chart } from '@dayli/tokens';

import { enter, springs } from '@/lib/motion';

import { clampY, Mark, NowLine, type MarkShape } from '@/components/ChartMark';
import { Press } from '@/components/Press';
import { T } from '@/components/Text';
import { useTheme } from '@/theme';

const START = 6 * 60;
const END = 24 * 60;
const SPAN = END - START;

export type WeekBlock = {
  id: string;
  start: string;
  end: string;
  /** ink is booked, green is done or new, red is an overlap or dropped, grey is context. */
  tone: 'ink' | 'green' | 'red' | 'grey';
  /** Outline only: where a shift used to be (dashed) or a dropped one (red). */
  outline?: 'dashed' | 'solid';
};

export type WeekMark = {
  id: string;
  time: string;
  /** A dot is a due date, a ring a quiz, a target an exam (`shapeFor`). */
  kind: MarkShape;
  tone?: 'ink' | 'red';
};

export type WeekDay = {
  date: string;
  blocks: WeekBlock[];
  marks?: WeekMark[];
  /** The source gave no time: an amber outlined bar with a question mark. */
  unknown?: boolean;
  /** Text under the bar, like "4–10p" or "off". */
  label?: string;
  labelTone?: 'ink' | 'green' | 'red' | 'amber' | 'grey';
  /** Strike the label: a dropped shift. */
  labelStrike?: boolean;
};

/**
 * The week as seven vertical day bars, 6 am to midnight. The same timeline as DayBar,
 * stood up. Used as the Plan header and in the schedule review.
 */
export function WeekChart({ days, selected, today, onSelect, onWeek, height = 120, animate, accessibilityLabel }: {
  days: WeekDay[]; selected?: string; today: string; onSelect?: (date: string) => void;
  /** Blocks and marks fade in as they are added, for a chart that fills while you watch. */
  animate?: boolean;
  /** VoiceOver's way to the next or previous week, where touch swipes. */
  onWeek?: (step: 1 | -1) => void; height?: number; accessibilityLabel?: string;
}) {
  return (
    <View style={styles.row} accessible={!onSelect} accessibilityRole={onSelect ? undefined : 'image'} accessibilityLabel={accessibilityLabel}>
      {days.map((day) => <DayColumn key={day.date} day={day} selected={day.date === selected} today={day.date === today} height={height} animate={animate} onSelect={onSelect} onWeek={onWeek} />)}
    </View>
  );
}

// Memoised so a tap re-renders only the two columns whose selection changed.
const DayColumn = memo(function DayColumn({ day, selected, today, height, animate, onSelect, onWeek }: { day: WeekDay; selected: boolean; today: boolean; height: number; animate?: boolean; onSelect?: (date: string) => void; onWeek?: (step: 1 | -1) => void }) {
  const { c } = useTheme();
  const tones = { ink: c.chartBooked, green: c.added, red: c.conflict, grey: c.controlOutline, amber: c.changed };
  const labelColor = day.labelTone ? tones[day.labelTone] : c.inkSecondary;
  // The ink pill behind the number pops in on a spring when this day is chosen.
  const sel = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    sel.value = withSpring(selected ? 1 : 0, springs.snappy);
  }, [selected, sel]);
  const pill = useAnimatedStyle(() => ({ opacity: sel.value, transform: [{ scale: 0.6 + 0.4 * sel.value }] }));
  const ring = useAnimatedStyle(() => ({ opacity: sel.value }));
  const column = (
    <>
      <T token="caption" color={today ? c.accentInk : c.inkSecondary} style={styles.weekday}>{weekdayShort(day.date)}</T>
      <View style={styles.num}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 14, backgroundColor: c.controlFill }, pill]} />
        <T token="subhead" color={selected ? c.controlInk : c.inkPrimary} tabular style={{ fontSize: 13 }}>{String(Number(day.date.slice(-2)))}</T>
      </View>
      <View style={[styles.track, { height, backgroundColor: day.unknown ? c.changedBg : c.row, borderWidth: day.unknown ? 1.5 : 0, borderColor: c.changed }]}>
        {/* The chosen day's column carries the same ink focus ring as a picked mark. */}
        <Animated.View pointerEvents="none" style={[styles.focus, { borderColor: c.inkPrimary }, ring]} />
        {day.unknown ? <T token="subhead" color={c.changed} style={{ alignSelf: 'center', marginTop: height / 2 - 9 }}>?</T> : null}
        {day.blocks.map((b) => {
          const s = Math.max(START, toMinutes(b.start));
          const e = Math.min(END, Math.max(toMinutes(b.end), s + 15));
          // A seam above and below, so back-to-back blocks read as two, as in the hour view.
          const top = ((s - START) / SPAN) * height + chart.blockGap / 2;
          const h = Math.max(3, ((e - s) / SPAN) * height - chart.blockGap);
          const color = tones[b.tone];
          return (
            <Animated.View key={b.id} entering={animate ? enter.fade : undefined} style={[styles.block, { top, height: h },
              b.outline ? { borderWidth: 1.5, borderColor: color, borderStyle: b.outline } : { backgroundColor: color }]} />
          );
        })}
        {today ? <NowLine at={{ y: nowTop(height) }} color={c.inkPrimary} inset={selected} /> : null}
        {mergeMarks((day.marks ?? []).map((m) => ({ ...m, y: ((Math.min(END, Math.max(START, toMinutes(m.time))) - START) / SPAN) * height })), chart.ring).map((m) => {
          const mark = <Mark key={m.id} at={{ y: clampY(m.y, height, m.kind) }} kind={m.kind} color={m.tone === 'red' ? c.conflict : c.chartBooked} />;
          return animate ? <Animated.View key={m.id} entering={enter.fade} pointerEvents="none" style={StyleSheet.absoluteFill}>{mark}</Animated.View> : mark;
        })}
      </View>
      {day.label ? <T token="caption" color={labelColor} tabular style={[styles.label, day.labelTone && day.labelTone !== 'grey' ? { fontFamily: undefined } : null, day.labelStrike ? { textDecorationLine: 'line-through' } : null]}>{day.label}</T> : null}
    </>
  );
  if (!onSelect) return <View style={styles.col}>{column}</View>;
  return (
    <Press onPress={() => onSelect(day.date)} accessibilityRole="button" accessibilityState={{ selected }}
      accessibilityLabel={`${weekdayShort(day.date)}, ${monthDay(day.date)}${today ? ', today' : ''}, ${day.blocks.length} ${day.blocks.length === 1 ? 'event' : 'events'}${day.marks?.length ? `, ${day.marks.length} due` : ''}`}
      accessibilityActions={onWeek ? [{ name: 'next', label: 'Next week' }, { name: 'previous', label: 'Previous week' }] : undefined}
      onAccessibilityAction={onWeek ? (e) => onWeek(e.nativeEvent.actionName === 'next' ? 1 : -1) : undefined}
      style={styles.col}>
      {column}
    </Press>
  );
});

function nowTop(height: number): number {
  const d = new Date();
  const mins = d.getHours() * 60 + d.getMinutes();
  return ((Math.min(END, Math.max(START, mins)) - START) / SPAN) * height;
}

/** "4–10p", "9a–3p", "11a–5p": the compact label under a day bar. */
export function compactRange(start: string, end: string): string {
  const part = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const hh = h! % 12 === 0 ? 12 : h! % 12;
    return `${hh}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
  };
  const ap = (t: string) => (Number(t.split(':')[0]) >= 12 ? 'p' : 'a');
  return ap(start) === ap(end) ? `${part(start)}–${part(end)}${ap(end)}` : `${part(start)}${ap(start)}–${part(end)}${ap(end)}`;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  col: { flex: 1, alignItems: 'center', gap: 6 },
  weekday: { fontSize: 11, lineHeight: 14 },
  num: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  track: { width: '100%', borderRadius: chart.column, position: 'relative', overflow: 'visible' },
  block: { position: 'absolute', left: 0, right: 0, borderRadius: chart.column },
  focus: { position: 'absolute', top: -(chart.focusGap + chart.now), bottom: -(chart.focusGap + chart.now), left: -(chart.focusGap + chart.now), right: -(chart.focusGap + chart.now),
    borderWidth: chart.now, borderRadius: chart.column + chart.focusGap + chart.now },
  label: { fontSize: 11, lineHeight: 14, textAlign: 'center' },
});
