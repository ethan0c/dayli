import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { CategoryDot } from '@/components/Controls';
import { DisclosureChevron } from '@/components/DisclosureChevron';
import { Press } from '@/components/Press';
import { T } from '@/components/Text';
import { enter, exit, layout } from '@/lib/motion';
import { useTheme, radius, size, fade } from '@/theme';

/*
 * The small parts of the review screen: a hairline row with a glyph column, the 36-high
 * pill that opens a native picker, the slot that holds the picker while it is open, and
 * the caption-sized disclosure that expands a list. Rows highlight, pills act.
 */

/** The 22-wide glyph column: a 6px dot, or a 12px ring for an exam. */
export function ReviewGlyph({ kind = 'dot', color }: { kind?: 'dot' | 'ring'; color?: string }) {
  const { c } = useTheme();
  return (
    <View style={styles.glyph}>
      {kind === 'ring' ? (
        <View style={[styles.ring, { borderColor: color ?? c.inkPrimary, backgroundColor: c.surface }]} />
      ) : (
        <CategoryDot color={color ?? c.inkPrimary} />
      )}
    </View>
  );
}

/** A hairline review row: glyph, title and sub, trailing controls, and an editor beneath when open. */
export function ReviewRow({ glyph, title, sub, trailing, struck, below, onPress, accessibilityLabel }: {
  glyph?: ReactNode; title: string; sub?: string | null; trailing?: ReactNode; struck?: boolean; below?: ReactNode; onPress?: () => void; accessibilityLabel?: string;
}) {
  const { c } = useTheme();
  const head = (
    <View style={styles.head}>
      {glyph}
      <View style={styles.text}>
        <T token="body" color={struck ? c.inkSecondary : c.inkPrimary} numberOfLines={2} style={struck ? styles.struck : undefined}>{title}</T>
        {sub ? <T token="caption" color={c.inkSecondary} numberOfLines={2}>{sub}</T> : null}
      </View>
      {trailing}
    </View>
  );
  return (
    <Animated.View layout={layout} entering={enter.fade} exiting={exit.fade} style={[styles.row, { borderBottomColor: c.line }]}>
      {onPress ? (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} style={({ pressed }) => ({ opacity: pressed ? fade.pressed : 1 })}>
          {head}
        </Pressable>
      ) : head}
      {below ? <View style={styles.below}>{below}</View> : null}
    </Animated.View>
  );
}

/** The 36-high pill that opens a picker: grey at rest, ink when it is the chosen option, muted when unset. */
export function ReviewPill({ label, onPress, selected, muted, accessibilityLabel }: {
  label: string; onPress: () => void; selected?: boolean; muted?: boolean; accessibilityLabel?: string;
}) {
  const { c } = useTheme();
  return (
    <Press accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ selected: !!selected }} haptic="select" onPress={onPress}
      style={[styles.pill, { backgroundColor: selected ? c.inkPrimary : c.row }]}>
      <T token="subhead" color={selected ? c.onPrimary : muted ? c.inkSecondary : c.inkPrimary} tabular numberOfLines={1}>{label}</T>
    </Press>
  );
}

/** Holds a native picker in the open-pill look: white with a 1.5 ink ring. */
export function ReviewPickerSlot({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  return <View style={[styles.slot, { backgroundColor: c.surface, borderColor: c.inkPrimary }]}>{children}</View>;
}

/** A row of pills and text buttons under a review row, indented to the text column. */
export function ReviewPillRow({ children }: { children: ReactNode }) {
  return <View style={styles.pills}>{children}</View>;
}

/** Caption-sized disclosure with a chevron that turns when open. */
export function ReviewDisclosure({ label, open, onPress }: { label: string; open: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ expanded: open }} style={({ pressed }) => [styles.disclosure, { opacity: pressed ? fade.pressed : 1 }]}>
      <T token="caption" color={c.inkSecondary} style={{ flex: 1 }}>{label}</T>
      <DisclosureChevron expanded={open} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { borderBottomWidth: StyleSheet.hairlineWidth },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingVertical: 8 },
  text: { flex: 1, minWidth: 0, gap: 2 },
  struck: { textDecorationLine: 'line-through' },
  glyph: { width: 22, alignItems: 'center', justifyContent: 'center' },
  ring: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  below: { paddingLeft: 34, paddingBottom: 14 },
  pills: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  pill: { height: size.pill, paddingHorizontal: 14, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  slot: { minHeight: size.pill, paddingHorizontal: 4, borderRadius: radius.pill, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  disclosure: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
