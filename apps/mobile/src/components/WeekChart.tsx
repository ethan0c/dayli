import { monthDay, toMinutes, weekdayShort } from '@dayli/core';
import { Pressable, StyleSheet, View } from 'react-native';

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
  /** A ring is an exam or deadline; a dot is a due date. */
  kind: 'ring' | 'dot';
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
};

/**
 * The week as seven vertical day bars, 6 am to midnight. The same timeline as DayBar,
 * stood up. Used as the Plan header and in the schedule review.
 */
export function WeekChart({ days, selected, today, onSelect, height = 120, accessibilityLabel }: {
  days: WeekDay[]; selected?: string; today: string; onSelect?: (date: string) => void; height?: number; accessibilityLabel?: string;
}) {
  const { c } = useTheme();
  const tones = { ink: c.inkPrimary, green: c.added, red: c.conflict, grey: c.controlOutline, amber: c.changed };
  return (
    <View style={styles.row} accessible={!onSelect} accessibilityRole={onSelect ? undefined : 'image'} accessibilityLabel={accessibilityLabel}>
      {days.map((day) => {
        const isSel = day.date === selected;
        const isToday = day.date === today;
        const labelColor = day.labelTone ? tones[day.labelTone] : c.inkSecondary;
        const column = (
          <>
            <T token="caption" color={isToday ? c.accentInk : c.inkSecondary} style={styles.weekday}>{weekdayShort(day.date)}</T>
            <View style={[styles.num, isSel ? { backgroundColor: c.inkPrimary } : null]}>
              <T token="subhead" color={isSel ? c.onPrimary : c.inkPrimary} tabular style={{ fontSize: 13 }}>{String(Number(day.date.slice(-2)))}</T>
            </View>
            <View style={[styles.track, { height, backgroundColor: day.unknown ? c.changedBg : c.row, borderWidth: day.unknown ? 1.5 : 0, borderColor: c.changed }]}>
              {day.unknown ? <T token="subhead" color={c.changed} style={{ alignSelf: 'center', marginTop: height / 2 - 9 }}>?</T> : null}
              {day.blocks.map((b) => {
                const s = Math.max(START, toMinutes(b.start));
                const e = Math.min(END, Math.max(toMinutes(b.end), s + 15));
                const top = ((s - START) / SPAN) * height;
                const h = Math.max(4, ((e - s) / SPAN) * height);
                const color = tones[b.tone];
                return (
                  <View key={b.id} style={[styles.block, { top, height: h },
                    b.outline ? { borderWidth: 1.5, borderColor: color, borderStyle: b.outline } : { backgroundColor: color }]} />
                );
              })}
              {(day.marks ?? []).map((m) => {
                const top = ((Math.min(END, Math.max(START, toMinutes(m.time))) - START) / SPAN) * height;
                const color = m.tone === 'red' ? c.conflict : c.inkPrimary;
                return m.kind === 'ring'
                  ? <View key={m.id} style={[styles.ring, { top: top - 5, borderColor: color, backgroundColor: c.surface }]} />
                  : <View key={m.id} style={[styles.dot, { top: top - 4, backgroundColor: color }]} />;
              })}
              {isToday ? <View style={[styles.now, { backgroundColor: c.inkPrimary, top: nowTop(height) }]} /> : null}
            </View>
            {day.label ? <T token="caption" color={labelColor} tabular style={[styles.label, day.labelTone && day.labelTone !== 'grey' ? { fontFamily: undefined } : null]}>{day.label}</T> : null}
          </>
        );
        if (!onSelect) return <View key={day.date} style={styles.col}>{column}</View>;
        return (
          <Pressable key={day.date} onPress={() => onSelect(day.date)} accessibilityRole="button" accessibilityState={{ selected: isSel }}
            accessibilityLabel={`${weekdayShort(day.date)}, ${monthDay(day.date)}${isToday ? ', today' : ''}, ${day.blocks.length} ${day.blocks.length === 1 ? 'block' : 'blocks'}`}
            style={({ pressed }) => [styles.col, { opacity: pressed ? 0.7 : 1 }]}>
            {column}
          </Pressable>
        );
      })}
    </View>
  );
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
  row: { flexDirection: 'row', gap: 6 },
  col: { flex: 1, alignItems: 'center', gap: 6 },
  weekday: { fontSize: 11, lineHeight: 14 },
  num: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  track: { width: '100%', borderRadius: 6, position: 'relative', overflow: 'visible' },
  block: { position: 'absolute', left: 0, right: 0, borderRadius: 6 },
  ring: { position: 'absolute', left: '50%', marginLeft: -5, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  dot: { position: 'absolute', left: '50%', marginLeft: -4, width: 8, height: 8, borderRadius: 4 },
  now: { position: 'absolute', left: -2, right: -2, height: 1.5 },
  label: { fontSize: 11, lineHeight: 14, textAlign: 'center' },
});
