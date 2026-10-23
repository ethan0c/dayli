import type { Assessment } from '@dayli/core';
import { chart } from '@dayli/tokens';
import { View, type ViewStyle } from 'react-native';

import { T } from '@/components/Text';
import { useTheme } from '@/theme';

/** Where a mark sits: a percent along a horizontal track, or pixels down a vertical column. */
export type At = { x: number } | { y: number };

/** A dot is something due, a ring a quiz or test, a ring with a centre (target) an exam. */
export type MarkShape = 'dot' | 'ring' | 'target';

export function shapeFor(test: Assessment | null): MarkShape {
  return test === 'exam' ? 'target' : test === 'quiz' ? 'ring' : 'dot';
}

/**
 * A zero-size anchor at the value itself. Everything drawn on a chart hangs from one of
 * these and is centred on it by negative offsets of half its own size, so a mark can never
 * drift off its value by picking its own `top`.
 */
function anchor(at: At): ViewStyle {
  return 'x' in at
    ? { position: 'absolute', left: `${at.x}%`, top: chart.track / 2, width: 0, height: 0 }
    : { position: 'absolute', top: at.y, left: '50%', width: 0, height: 0 };
}

/**
 * A dot (due), ring (quiz) or target (exam), centred on its value. Each is cut out of whatever it
 * sits on by a thin canvas halo, so a dot on a block of its own colour, or two marks a day
 * apart, still read as separate marks; a ring's hollow is the canvas too.
 */
export function Mark({ at, kind, color, selected }: { at: At; kind: MarkShape; color: string; /** Picked: an ink focus ring around the halo. */ selected?: boolean }) {
  const { c } = useTheme();
  const size = kind === 'dot' ? chart.dot : chart.ring;
  const outer = size + (selected ? (chart.focusGap + chart.now) * 2 : chart.halo * 2);
  return (
    <View pointerEvents="none" style={anchor(at)}>
      <View style={[{ position: 'absolute', left: -outer / 2, top: -outer / 2, width: outer, height: outer, borderRadius: outer / 2, backgroundColor: c.canvas, alignItems: 'center', justifyContent: 'center' },
        selected ? { borderWidth: chart.now, borderColor: c.inkPrimary } : null]}>
        <View style={[
          { width: size, height: size, borderRadius: size / 2 },
          kind === 'dot' ? { backgroundColor: color } : { borderWidth: chart.ringStroke, borderColor: color, backgroundColor: c.canvas, alignItems: 'center', justifyContent: 'center' },
        ]}>
          {kind === 'target' ? <View style={{ width: chart.targetDot, height: chart.targetDot, borderRadius: chart.targetDot / 2, backgroundColor: color }} /> : null}
        </View>
      </View>
    </View>
  );
}

/**
 * The now hairline, centred on the moment. Across a horizontal track it stands up and
 * overhangs the track on both sides; across a vertical column it lies flat, just past the edges.
 */
export function NowLine({ at, color, inset }: { at: At; color: string; /** A focused column: stop at its edges so the line never meets the focus ring. */ inset?: boolean }) {
  const across = 'x' in at;
  const long = across ? chart.track + chart.nowOverhang * 2 : 0;
  return (
    <View pointerEvents="none" style={across ? anchor(at) : { position: 'absolute', top: at.y, left: inset ? 0 : -chart.nowColumnOverhang, right: inset ? 0 : -chart.nowColumnOverhang, height: 0 }}>
      <View style={across
        ? { position: 'absolute', left: -chart.now / 2, top: -long / 2, width: chart.now, height: long, backgroundColor: color }
        : { position: 'absolute', left: 0, right: 0, top: -chart.now / 2, height: chart.now, backgroundColor: color }} />
    </View>
  );
}

/** Keeps a column mark inside its column, halo and all: a midnight due date sits above the bottom edge, never on it. */
export function clampY(y: number, height: number, kind: MarkShape): number {
  const r = (kind === 'dot' ? chart.dot : chart.ring) / 2 + chart.halo + chart.focusGap;
  return Math.min(height - r, Math.max(r, y));
}

export type KeyEntry = {
  label: string;
  color: string;
  /** The mark itself: a ring or dot, a filled block, an outlined block (dashed or solid), or the now hairline. */
  glyph: MarkShape | 'block' | 'dashed' | 'outline' | 'now';
};

/**
 * The chart's key: each mark drawn at its real size beside one word, only for marks on
 * screen right now. Always there under a chart that uses more than plain bars, never a tour.
 */
export function ChartKey({ entries, style }: { entries: KeyEntry[]; style?: ViewStyle }) {
  const { c } = useTheme();
  if (!entries.length) return null;
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6 }, style]} accessibilityRole="text"
      accessibilityLabel={`Key: ${entries.map((e) => e.label).join(', ')}`}>
      {entries.map((e) => (
        <View key={e.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: KEY, height: KEY, alignItems: 'center', justifyContent: 'center' }}>
            {e.glyph === 'ring' || e.glyph === 'dot' || e.glyph === 'target'
              ? <Mark at={{ y: KEY / 2 }} kind={e.glyph} color={e.color} />
              : e.glyph === 'now'
                ? <View style={{ width: chart.now, height: KEY, backgroundColor: e.color }} />
                : <View style={[{ width: KEY, height: chart.track, borderRadius: chart.track / 2 },
                  e.glyph === 'block' ? { backgroundColor: e.color } : { borderWidth: 1.5, borderColor: e.color, borderStyle: e.glyph === 'dashed' ? 'dashed' : 'solid', height: chart.track + 2 }]} />}
          </View>
          <T token="caption" color={c.inkSecondary} style={{ fontSize: 11, lineHeight: 14 }}>{e.label}</T>
        </View>
      ))}
    </View>
  );
}

const KEY = chart.ring + chart.halo * 2;

/** Key entries, first of each label wins, in the order given. */
export function keyOf(entries: (KeyEntry | false | undefined)[]): KeyEntry[] {
  const seen = new Set<string>();
  return entries.filter((e): e is KeyEntry => !!e && !seen.has(e.label) && !!seen.add(e.label));
}

/** The key for marks on a line or in a column: only the shapes and tones on screen, in reading order. */
export function markKey(marks: { kind: MarkShape; tone?: string }[], c: { chartBooked: string; conflict: string; added: string }): KeyEntry[] {
  // Shape says what it is, colour says when: every shape on screen is keyed in ink whatever its
  // tone, and red is keyed once as a colour, so a red exam never leaves "Exam" unexplained.
  const shape = (kind: MarkShape) => marks.some((m) => m.kind === kind);
  const red = marks.some((m) => m.tone === 'red');
  return keyOf([
    shape('dot') && { glyph: 'dot', color: c.chartBooked, label: 'Due' },
    shape('ring') && { glyph: 'ring', color: c.chartBooked, label: 'Quiz' },
    shape('target') && { glyph: 'target', color: c.chartBooked, label: 'Exam' },
    red && { glyph: 'dot', color: c.conflict, label: 'Due today' },
    marks.some((m) => m.tone === 'green') && { glyph: 'dot', color: c.added, label: 'Done' },
  ]);
}
