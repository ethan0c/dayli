import { dayNumber } from '@dayli/core';
import { chart } from '@dayli/tokens';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Mark, NowLine, type MarkShape } from '@/components/ChartMark';
import { T } from '@/components/Text';
import { useTheme } from '@/theme';

export type TermMark = {
  id: string;
  date: string;
  /** A dot is a due date, a ring a quiz, a target an exam (`shapeFor`). */
  kind: MarkShape;
  tone?: 'ink' | 'green';
  /** Shown under the line for the few that matter (tests). */
  label?: string;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * A span of time as one line with marks on it: the term in the syllabus review, the next
 * four weeks on School. Month or week labels above, a hairline for today, labels below.
 */
export function TermLine({ from, to, marks, today, scale = 'months', weekLabels, labels = true, selected, onPick }: {
  from: string; to: string; marks: TermMark[]; today?: string; scale?: 'months' | 'weeks' | 'none'; weekLabels?: string[];
  /** The row under the line with "today" and the labelled marks; off for a compact strip. */
  labels?: boolean;
  /** The picked mark, drawn with a focus ring. */
  selected?: string;
  /** Makes the line tappable: a tap picks the nearest mark within reach, or nothing (null). */
  onPick?: (id: string | null) => void;
}) {
  const { c } = useTheme();
  const [width, setWidth] = useState(0);
  const a = dayNumber(from);
  const span = Math.max(1, dayNumber(to) - a);
  const pct = (date: string) => Math.min(100, Math.max(0, ((dayNumber(date) - a) / span) * 100));
  const tones = { ink: c.chartBooked, green: c.added };
  const showToday = !!today && today >= from && today <= to;
  // Dots first, rings over them, red over ink: the mark that matters most is the one you see.
  const ordered = [...marks].sort((x, y) => rank(x) - rank(y));
  const shown = placeLabels(marks.filter((m) => m.label).map((m) => ({ id: m.id, p: pct(m.date), label: m.label! })), showToday && pct(today!) < 8, width - INSET * 2);
  // Marks are 8 to 12 points, too small to hit; a tap anywhere on the line takes the nearest one.
  const pick = (x: number) => {
    const plot = width - INSET * 2;
    const nearest = marks.map((m) => ({ id: m.id, d: Math.abs(INSET + (pct(m.date) / 100) * plot - x) })).sort((p, q) => p.d - q.d)[0];
    onPick!(nearest && nearest.d <= REACH ? nearest.id : null);
  };
  const body = (
    <View style={{ gap: 8 }} pointerEvents={onPick ? 'none' : 'auto'}>
      {scale === 'months' ? (
        <View style={styles.scale}>
          {monthSpans(from, to).map((m) => (
            // A month with too few days on the line to hold its name keeps its space but not its label.
            <T key={m.key} token="caption" color={c.inkSecondary} numberOfLines={1} style={[styles.scaleLabel, { width: `${m.pct}%` }]}>
              {width && (m.pct / 100) * (width - INSET * 2) < MONTH ? '' : m.label}
            </T>
          ))}
        </View>
      ) : scale === 'weeks' && weekLabels ? (
        <View style={styles.scale}>
          {weekLabels.map((l) => <T key={l} token="caption" color={c.inkSecondary} tabular style={[styles.scaleLabel, { flex: 1 }]}>{l}</T>)}
        </View>
      ) : null}
      <View style={[styles.track, { backgroundColor: c.row }]} accessible accessibilityRole="image" accessibilityLabel={describe(marks, from, to)}>
        <View style={styles.plot} pointerEvents="none">
          {showToday ? <NowLine at={{ x: pct(today!) }} color={c.inkPrimary} /> : null}
          {ordered.map((m) => <Mark key={m.id} at={{ x: pct(m.date) }} kind={m.kind} color={tones[m.tone ?? 'ink']} selected={m.id === selected} />)}
        </View>
      </View>
      {labels && (shown.length || showToday) ? (
        <View style={styles.labels}>
          {showToday && pct(today!) < 8 ? <T token="caption" color={c.inkSecondary} style={[styles.label, { left: -INSET }]}>Today</T> : null}
          {shown.map((m) => {
            const pos = m.p < 8 ? { left: -INSET } : m.p > 92 ? { right: -INSET } : { left: `${m.p}%` as const, marginLeft: -LABEL / 2, width: LABEL, textAlign: 'center' as const };
            return <T key={m.id} token="caption" color={c.inkSecondary} tabular style={[styles.label, pos]}>{m.label}</T>;
          })}
        </View>
      ) : null}
    </View>
  );
  return onPick ? (
    <Pressable onLayout={(e) => setWidth(e.nativeEvent.layout.width)} hitSlop={{ top: 11, bottom: 11 }} accessible={false}
      onPress={(e) => pick(e.nativeEvent.locationX)}>
      {body}
    </Pressable>
  ) : <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>{body}</View>;
}

/** How far from a mark a tap still picks it. */
const REACH = 22;

/** Half the largest mark: the plot sits this far inside the line, so no mark hangs off an end. */
const INSET = chart.ring / 2;
/** The slot a label under the line is centred in. */
const LABEL = 72;
/** The least width a month name needs above the line. */
const MONTH = 26;

function describe(marks: TermMark[], from: string, to: string): string {
  const n = (kind: MarkShape) => marks.filter((m) => m.kind === kind).length;
  const parts = [[n('target'), 'exam', 'exams'], [n('ring'), 'quiz', 'quizzes'], [n('dot'), 'due date', 'due dates']] as const;
  const said = parts.filter(([k]) => k).map(([k, one, many]) => `${k} ${k === 1 ? one : many}`);
  return `${said.length > 1 ? `${said.slice(0, -1).join(', ')} and ${said.at(-1)}` : said[0] ?? 'Nothing'} between ${from} and ${to}`;
}

function rank(m: TermMark): number {
  return { dot: 0, ring: 2, target: 4 }[m.kind];
}

/**
 * Labels left to right, each kept only if it clears the one before by `chart.labelGap`.
 * Before the width is known every label shows, as it did; a dropped label's mark stays.
 */
function placeLabels<L extends { p: number }>(labelled: L[], todayAtStart: boolean, plot: number): L[] {
  if (plot <= 0) return labelled;
  const box = (p: number) => {
    const x = (p / 100) * plot;
    return p < 8 ? [-INSET, LABEL - INSET] : p > 92 ? [plot + INSET - LABEL, plot + INSET] : [x - LABEL / 2, x + LABEL / 2];
  };
  let right = todayAtStart ? 40 - INSET : -Infinity;
  return [...labelled].sort((x, y) => x.p - y.p).filter((l) => {
    const [l0, l1] = box(l.p);
    if (l0! < right + chart.labelGap) return false;
    right = l1!;
    return true;
  });
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
  scale: { flexDirection: 'row', marginHorizontal: INSET },
  scaleLabel: { fontSize: 11, lineHeight: 14 },
  track: { height: chart.track, borderRadius: chart.track / 2, position: 'relative' },
  plot: { position: 'absolute', top: 0, bottom: 0, left: INSET, right: INSET },
  labels: { position: 'relative', height: 16, marginHorizontal: INSET },
  label: { position: 'absolute', fontSize: 11, lineHeight: 14 },
});
