import { mergeMarks, monthDay, toMinutes, weekdayShort } from '@dayli/core';
import { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';

import { chart, motion } from '@dayli/tokens';

import { durations, ease, enter, springs } from '@/lib/motion';

import { clampY, Mark, NowLine, type MarkShape } from '@/components/ChartMark';
import { Press } from '@/components/Press';
import { T } from '@/components/Text';
import { textStyle, useTheme } from '@/theme';

const START = 6 * 60;
const END = 24 * 60;
const SPAN = END - START;

export type WeekBlock = {
  id: string;
  start: string;
  end: string;
  /** ink is booked, green is done or new, red is an overlap or dropped, grey is past or context. */
  tone: 'ink' | 'green' | 'red' | 'grey';
  /** Outline only: where a shift used to be (dashed) or a dropped one (red). */
  outline?: 'dashed' | 'solid';
  /** What it is, when the chart mixes kinds: a booked shift is plum, anything else slate. Unset is plum. */
  kind?: 'shift' | 'other';
};

export type WeekMark = {
  id: string;
  time: string;
  /** A dot is a due date, a ring a quiz, a target an exam (`shapeFor`). */
  kind: MarkShape;
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
 *
 * One ink pill and one focus ring mark the chosen day and slide between days on the snappy
 * spring, the way a segmented control's thumb does; each day's number turns to the pill's ink
 * exactly as the pill passes under it. Rest a finger on the chart for a moment and drag to scrub:
 * the choice follows the finger a day at a time, each with a selection tick from the caller.
 */
export function WeekChart({ days, selected, today, onSelect, onWeek, scrub = false, onScrub, height = 120, animate, accessibilityLabel }: {
  days: WeekDay[]; selected?: string; today: string; onSelect?: (date: string) => void;
  /** Blocks and marks fade in as they are added, for a chart that fills while you watch. */
  animate?: boolean;
  /** VoiceOver's way to the next or previous week, where touch swipes. */
  onWeek?: (step: 1 | -1) => void;
  /** Hold and drag to scrub through the days. Plan's chart, where picking a day is cheap; not the review's. */
  scrub?: boolean;
  /** True while a finger scrubs the chart, so the page can stop scrolling under it. */
  onScrub?: (active: boolean) => void;
  height?: number; accessibilityLabel?: string;
}) {
  const { c } = useTheme();
  const [width, setWidth] = useState(0);
  const [geo, setGeo] = useState<Geometry | null>(null);
  const step = width > 0 ? (width - GAP * (days.length - 1)) / days.length + GAP : 0;
  const index = days.findIndex((d) => d.date === selected);

  // Where the pill sits, in columns, and whether there is a chosen day in this week at all.
  const x = useSharedValue(Math.max(0, index));
  const shown = useSharedValue(index >= 0 ? 1 : 0);
  const was = useRef(index);
  useEffect(() => {
    if (index >= 0) x.value = was.current >= 0 ? withSpring(index, springs.snappy) : index;
    shown.value = withTiming(index >= 0 ? 1 : 0, { duration: durations.fast, easing: ease });
    was.current = index;
  }, [index, x, shown]);
  const pill = useAnimatedStyle(() => ({ opacity: shown.value, transform: [{ translateX: x.value * step }] }));
  const ring = useAnimatedStyle(() => ({ opacity: shown.value, transform: [{ translateX: x.value * step }] }));

  // Scrub: hold, then drag. Runs on the JS thread; it only picks days.
  const scrubbed = useRef(-1);
  const pick = (at: number) => {
    if (!onSelect || step <= 0) return;
    const i = Math.max(0, Math.min(days.length - 1, Math.floor((at + GAP / 2) / step)));
    if (i === scrubbed.current) return;
    scrubbed.current = i;
    onSelect(days[i]!.date);
  };
  const scrubbing = usePanGesture({
    enabled: scrub && !!onSelect,
    runOnJS: true,
    activateAfterLongPress: motion.hold,
    onActivate: (e) => { scrubbed.current = -1; onScrub?.(true); pick(e.x); },
    onUpdate: (e) => pick(e.x),
    onFinalize: () => { onScrub?.(false); },
  });

  const colW = step - GAP;
  const ringPad = chart.focusGap + chart.now;
  return (
    <GestureDetector gesture={scrubbing}>
      <View style={styles.row} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessible={!onSelect} accessibilityRole={onSelect ? undefined : 'image'} accessibilityLabel={accessibilityLabel}>
        {geo && step > 0 ? (
          <>
            <Animated.View pointerEvents="none" style={[styles.pill, { top: geo.numY, left: (colW - NUM) / 2, backgroundColor: c.controlFill }, pill]} />
            <Animated.View pointerEvents="none" style={[styles.focus, { top: geo.trackY - ringPad, left: -ringPad, width: colW + ringPad * 2, height: geo.trackH + ringPad * 2, borderColor: c.inkPrimary }, ring]} />
          </>
        ) : null}
        {days.map((day, i) => (
          <DayColumn key={day.date} day={day} index={i} x={x} shown={shown} selected={i === index} today={day.date === today} height={height} animate={animate}
            onSelect={onSelect} onWeek={onWeek} onMeasure={i === 0 ? setGeo : undefined} />
        ))}
      </View>
    </GestureDetector>
  );
}

const GAP = 6;
const NUM = 28;
type Geometry = { numY: number; trackY: number; trackH: number };

const AnimatedText = Animated.createAnimatedComponent(Text);

// Memoised so a tap re-renders only the two columns whose selection changed.
const DayColumn = memo(function DayColumn({ day, index, x, shown, selected, today, height, animate, onSelect, onWeek, onMeasure }: {
  day: WeekDay; index: number; x: SharedValue<number>; shown: SharedValue<number>; selected: boolean; today: boolean; height: number; animate?: boolean;
  onSelect?: (date: string) => void; onWeek?: (step: 1 | -1) => void; onMeasure?: (geo: Geometry) => void;
}) {
  const { c } = useTheme();
  const tones = { ink: c.chartBooked, green: c.added, red: c.conflict, grey: c.controlOutline, amber: c.changed };
  const labelColor = day.labelTone ? tones[day.labelTone] : c.inkSecondary;
  // How much of the sliding pill is under this number: 1 when it sits here, 0 a column away.
  const number = useAnimatedStyle(() => ({
    color: interpolateColor(Math.max(0, 1 - Math.abs(x.value - index)) * shown.value, [0, 1], [c.inkPrimary, c.controlInk]),
  }));
  const ys = useRef({ numY: 0, trackY: 0, trackH: 0, got: 0 });
  const measured = (key: 'num' | 'track') => onMeasure ? (e: LayoutChangeEvent) => {
    const { y, height: h } = e.nativeEvent.layout;
    if (key === 'num') ys.current.numY = y; else { ys.current.trackY = y; ys.current.trackH = h; }
    ys.current.got |= key === 'num' ? 1 : 2;
    if (ys.current.got === 3) onMeasure({ numY: ys.current.numY, trackY: ys.current.trackY, trackH: ys.current.trackH });
  } : undefined;
  const column = (
    <>
      <T token="axis" color={today ? c.accentInk : c.inkSecondary}>{weekdayShort(day.date)}</T>
      <View style={styles.num} onLayout={measured('num')}>
        <AnimatedText style={[textStyle('subhead', c.inkPrimary), { fontSize: 13, fontVariant: ['tabular-nums'] }, number]}>{String(Number(day.date.slice(-2)))}</AnimatedText>
      </View>
      <View onLayout={measured('track')} style={[styles.track, { height, backgroundColor: day.unknown ? c.changedBg : c.row, borderWidth: day.unknown ? 1.5 : 0, borderColor: c.changed }]}>
        {day.unknown ? <T token="subhead" color={c.changed} style={{ alignSelf: 'center', marginTop: height / 2 - 9 }}>?</T> : null}
        {day.blocks.map((b) => {
          const s = Math.max(START, toMinutes(b.start));
          const e = Math.min(END, Math.max(toMinutes(b.end), s + 15));
          // A seam above and below, so back-to-back blocks read as two, as in the hour view.
          const top = ((s - START) / SPAN) * height + chart.blockGap / 2;
          const h = Math.max(3, ((e - s) / SPAN) * height - chart.blockGap);
          const color = b.tone === 'ink' && b.kind === 'other' ? c.chartOther : tones[b.tone];
          return (
            <Animated.View key={b.id} entering={animate ? enter.fade : undefined} style={[styles.block, { top, height: h },
              b.outline ? { borderWidth: 1.5, borderColor: color, borderStyle: b.outline } : { backgroundColor: color }]} />
          );
        })}
        {today ? <NowLine at={{ y: nowTop(height) }} color={c.inkPrimary} inset={selected} /> : null}
        {mergeMarks((day.marks ?? []).map((m) => ({ ...m, y: ((Math.min(END, Math.max(START, toMinutes(m.time))) - START) / SPAN) * height })), chart.ring).map((m) => {
          const mark = <Mark key={m.id} at={{ y: clampY(m.y, height, m.kind) }} kind={m.kind} color={c.chartBooked} />;
          return animate ? <Animated.View key={m.id} entering={enter.fade} pointerEvents="none" style={StyleSheet.absoluteFill}>{mark}</Animated.View> : mark;
        })}
      </View>
      {day.label ? <T token="axis" color={labelColor} tabular style={[styles.label, day.labelStrike ? { textDecorationLine: 'line-through' } : null]}>{day.label}</T> : null}
    </>
  );
  if (!onSelect) return <View style={styles.col}>{column}</View>;
  // No shrink: the sliding pill is the answer to the tap, and a column that shrank would leave it behind.
  return (
    <Press onPress={() => onSelect(day.date)} scale={1} dim={1} accessibilityRole="button" accessibilityState={{ selected }}
      accessibilityLabel={`${weekdayShort(day.date)}, ${monthDay(day.date)}${today ? ', today' : ''}, ${blockCount(day.blocks)}${day.marks?.length ? `, ${day.marks.length} due` : ''}`}
      accessibilityActions={onWeek ? [{ name: 'next', label: 'Next week' }, { name: 'previous', label: 'Previous week' }] : undefined}
      onAccessibilityAction={onWeek ? (e) => onWeek(e.nativeEvent.actionName === 'next' ? 1 : -1) : undefined}
      style={styles.col}>
      {column}
    </Press>
  );
});

/** "2 shifts, 1 other event" where blocks say what they are, else "3 events". */
function blockCount(blocks: WeekBlock[]): string {
  const n = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
  if (!blocks.some((b) => b.kind)) return n(blocks.length, 'event', 'events');
  const shifts = blocks.filter((b) => b.kind === 'shift').length;
  const others = blocks.length - shifts;
  return [shifts && n(shifts, 'shift', 'shifts'), others && n(others, 'other event', 'other events')].filter(Boolean).join(', ') || n(0, 'event', 'events');
}

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
  row: { flexDirection: 'row', gap: GAP },
  col: { flex: 1, alignItems: 'center', gap: 6 },
  num: { width: NUM, height: NUM, alignItems: 'center', justifyContent: 'center' },
  pill: { position: 'absolute', width: NUM, height: NUM, borderRadius: NUM / 2 },
  track: { width: '100%', borderRadius: chart.column, position: 'relative', overflow: 'visible' },
  block: { position: 'absolute', left: 0, right: 0, borderRadius: chart.column },
  focus: { position: 'absolute', borderWidth: chart.now, borderRadius: chart.column + chart.focusGap + chart.now },
  label: { textAlign: 'center' },
});
