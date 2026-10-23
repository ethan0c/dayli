import { addDays, diffDays, formatTime, monthDay, relativeDay, weekdayShort } from '@dayli/core';
import type { Item } from '@dayli/schema';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { motion } from '@dayli/tokens';

import { GlassCircle } from '@/components/Glass';
import { Icon, type IconKey } from '@/components/Icon';
import { Press } from '@/components/Press';
import { T } from '@/components/Text';
import type { Cue } from '@/lib/feedback';
import { corner, radius, useTheme, size, fade } from '@/theme';

/*
 * The five button roles and the small parts every screen shares.
 * Pills act, rectangles hold: every control here is fully round; rows and fields are not.
 * See docs/design-system.md.
 */

/** Text button: accent, underlined. `muted` is the quiet alternative (accent, no underline), `danger` for destructive. */
export function TextButton({ label, onPress, tone = 'accent', haptic = 'select', accessibilityLabel, disabled = false, style }: {
  label: string; onPress: () => void; tone?: 'accent' | 'muted' | 'danger'; haptic?: Cue; accessibilityLabel?: string; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  const color = tone === 'danger' ? c.conflict : c.accentInk;
  return (
    <Press accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ disabled }} disabled={disabled} haptic={haptic} onPress={onPress} style={[styles.textBtn, style, disabled && { opacity: 0.5 }]}>
      <T token="subhead" color={color} style={tone === 'muted' ? undefined : styles.underline}>
        {label}
      </T>
    </Press>
  );
}

/** Icon button: a 44 circle, grey, ink or theme primary. `glass` is for chrome at the top of a screen: Liquid Glass on iOS 26, the grey circle elsewhere. */
export function IconButton({ icon, onPress, label, tone = 'grey', size = 44, haptic = 'tap', disabled, style }: {
  icon: IconKey; onPress: () => void; label: string; tone?: 'grey' | 'ink' | 'primary' | 'bare' | 'glass'; size?: number; haptic?: Cue; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  if (tone === 'glass') {
    return (
      <Press accessibilityRole="button" accessibilityLabel={label} haptic={haptic} onPress={onPress} disabled={disabled} scale={motion.press.iconScale} style={[{ opacity: disabled ? fade.disabled : 1 }, style]}>
        <GlassCircle size={size}><Icon name={icon} size={size >= 44 ? 22 : 18} color={c.inkPrimary} /></GlassCircle>
      </Press>
    );
  }
  const bg = tone === 'primary' ? c.controlFill : tone === 'ink' ? c.inkPrimary : tone === 'grey' ? c.row : 'transparent';
  return (
    <Press accessibilityRole="button" accessibilityLabel={label} haptic={haptic} onPress={onPress} disabled={disabled} scale={motion.press.iconScale}
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', opacity: disabled ? fade.disabled : 1 }, style]}>
      <Icon name={icon} size={size >= 44 ? 22 : 18} color={tone === 'primary' ? c.controlInk : tone === 'ink' ? c.onPrimary : c.inkPrimary} strokeWidth={tone === 'ink' || tone === 'primary' ? 2 : 1.75} />
    </Press>
  );
}

/** Chip: the 40-high secondary, for multi-select and filters. */
export function Chip({ label, icon, on, onPress }: { label: string; icon?: IconKey; on: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Press accessibilityRole="checkbox" accessibilityState={{ checked: on }} haptic="select" onPress={onPress}
      style={[styles.chip, { backgroundColor: on ? c.controlFill : c.row }]}>
      {icon ? <Icon name={icon} size={16} color={on ? c.controlInk : c.inkPrimary} /> : null}
      <T token="subhead" color={on ? c.controlInk : c.inkPrimary}>
        {label}
      </T>
    </Press>
  );
}

/** Tile: the 64-high secondary with an icon over a label (Screenshot, Camera, PDF). */
export function Tile({ icon, label, onPress, disabled }: { icon: IconKey; label: string; onPress: () => void; disabled?: boolean }) {
  const { c } = useTheme();
  return (
    <Press accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} haptic="tap" onPress={onPress} disabled={disabled}
      style={[styles.tile, { backgroundColor: c.row, opacity: disabled ? fade.disabled : 1 }]}>
      <Icon name={icon} size={20} color={c.inkPrimary} />
      <T token="caption" color={c.inkPrimary}>
        {label}
      </T>
    </Press>
  );
}

export type PillTone = 'grey' | 'red' | 'green' | 'amber' | 'redText';

/** Status pill. Red is behind, green is ahead, amber needs input, grey is a time or a neutral state. */
export function StatusPill({ label, tone = 'grey', tabular = true, multiline = false }: { label: string; tone?: PillTone; tabular?: boolean; multiline?: boolean }) {
  const { c } = useTheme();
  const look = {
    grey: { bg: c.row, ink: c.inkPrimary },
    redText: { bg: c.row, ink: c.conflict },
    red: { bg: c.conflict, ink: c.onPrimary },
    green: { bg: c.addedBg, ink: c.added },
    amber: { bg: c.changedBg, ink: c.changed },
  }[tone];
  return (
    <View style={[styles.pill, multiline && styles.pillMultiline, { backgroundColor: look.bg }]}>
      <T token="subhead" color={look.ink} tabular={tabular} numberOfLines={multiline ? undefined : 1}>
        {label}
      </T>
    </View>
  );
}

/** Section title at 24 Regular with a chevron when it leads somewhere. */
export function SectionTitle({ title, onPress, detail }: { title: string; onPress?: () => void; detail?: string }) {
  const { c } = useTheme();
  const inner = (
    <View style={styles.sectionTitle}>
      <T token="title" accessibilityRole="header" style={{ flexShrink: 1 }}>{title}</T>
      {onPress ? <Icon name="chevronRight" size={18} color={c.inkSecondary} /> : null}
      {detail ? <T token="caption" color={c.inkSecondary} style={{ marginLeft: 'auto', flexShrink: 1, textAlign: 'right' }}>{detail}</T> : null}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? fade.pressed : 1 })}>
      {inner}
    </Pressable>
  );
}

/** Sentence-case group label above a run of rows. */
export function GroupLabel({ children }: { children: string }) {
  const { c } = useTheme();
  return (
    <T token="overline" color={c.inkSecondary} style={styles.groupLabel}>
      {children}
    </T>
  );
}

/** A hairline row: optional leading element, title and sub, trailing element or chevron. Highlights on press, never shrinks. */
export function ListRow({ title, sub, leading, trailing, onPress, chevron = !!onPress, last, accessibilityLabel, destructive }: {
  title: string; sub?: string | null; leading?: ReactNode; trailing?: ReactNode; onPress?: () => void; chevron?: boolean; last?: boolean; accessibilityLabel?: string; destructive?: boolean;
}) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.row, !last ? { borderBottomColor: c.line, borderBottomWidth: StyleSheet.hairlineWidth } : null, pressed ? { backgroundColor: c.row, marginHorizontal: -8, paddingHorizontal: 8, ...corner(radius.small) } : null]}>
      {leading}
      <View style={styles.rowText}>
        <T token="body" color={destructive ? c.conflict : c.inkPrimary} numberOfLines={2}>{title}</T>
        {sub ? <T token="caption" color={c.inkSecondary} numberOfLines={2}>{sub}</T> : null}
      </View>
      {trailing}
      {chevron ? <Icon name="chevronRight" size={16} color={c.inkTertiary} /> : null}
    </Pressable>
  );
}

/** One choice of several: filled with a dot when chosen, an outline when not. The one radio everywhere. */
export function Radio({ on }: { on: boolean }) {
  const { c } = useTheme();
  return (
    <View style={[styles.radio, on ? { backgroundColor: c.controlFill } : { borderWidth: 1.5, borderColor: c.controlOutline }]}>
      {on ? <View style={[styles.radioDot, { backgroundColor: c.controlInk }]} /> : null}
    </View>
  );
}

/** A 10px dot in the category or course tint, big enough to tell six hues apart in a row; with a course's check ring, the only place those colors appear. */
export function CategoryDot({ color, size = 10 }: { color: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}

/**
 * What the status pill on a row should say for an item, given today's date.
 * `compact` gives the short form for lists that already carry context: "Fri 9 am", "Oct 27".
 */
export function itemStatus(item: Pick<Item, 'kind' | 'date' | 'start' | 'end' | 'done' | 'isDeadline'> & { category?: Item['category'] }, today: string, conflict = false, compact = false): { label: string; tone: PillTone } {
  if (item.done) return { label: 'Done', tone: 'green' };
  // A shift the source gave no time for: Semli needs one before it can remind you.
  if (item.kind === 'event' && item.category === 'work' && !item.start && item.date >= today) return { label: 'Add a time', tone: 'amber' };
  const time = item.start ? formatTime(item.start) : null;
  if (compact && item.date > today) {
    const days = diffDays(today, item.date);
    const when = days <= 6 ? weekdayShort(item.date) : monthDay(item.date);
    const overdueish = item.isDeadline && days === 1;
    return { label: `${when}${time && days <= 6 ? ` ${time}` : ''}`, tone: overdueish ? 'red' : conflict ? 'redText' : 'grey' };
  }
  if (item.kind === 'event') {
    if (item.date === today) return { label: time ?? 'All day', tone: conflict ? 'redText' : 'grey' };
    return { label: `${relativeDay(today, item.date)}${time ? ` ${time}` : ''}`, tone: conflict ? 'redText' : 'grey' };
  }
  if (item.date < today) return { label: 'Overdue', tone: 'red' };
  if (item.isDeadline && item.date === today) return { label: 'Due today', tone: 'red' };
  if (item.isDeadline && item.date === addDays(today, 1)) return { label: `Due ${time ? `tomorrow ${time}` : 'tomorrow'}`, tone: 'red' };
  if (item.date === today) return { label: time ?? 'Any time', tone: 'grey' };
  return { label: `${relativeDay(today, item.date)}${time ? ` ${time}` : ''}`, tone: 'grey' };
}

const styles = StyleSheet.create({
  radio: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 7, height: 7, borderRadius: 4 },
  textBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 2 },
  underline: { textDecorationLine: 'underline' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 40, borderRadius: 999 },
  tile: { flex: 1, height: 64, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', gap: 4 },
  pill: { height: size.chip, paddingHorizontal: 10, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', maxWidth: 160 },
  pillMultiline: { height: 'auto', minHeight: 28, paddingVertical: 4, maxWidth: '100%' },
  sectionTitle: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingBottom: 12 },
  groupLabel: { paddingBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 8 },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
});
