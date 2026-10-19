import { formatRange, formatTime } from '@dayli/core';
import type { Item } from '@dayli/schema';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Icon } from '@/components/Icon';
import { T } from '@/components/Text';
import { springs } from '@/lib/motion';
import { useStore } from '@/store';
import { useTheme } from '@/theme';

type RowItem = Pick<Item, 'kind' | 'title' | 'category' | 'icon' | 'start' | 'end' | 'done' | 'isDeadline'> & { courseId?: string | null };
type Props = { item: RowItem; conflict?: boolean; planned?: boolean; onPress?: () => void; onToggle?: () => void };

/** Open agenda rows: time explains events, completion controls identify tasks. */
export function ItemRow({ item, conflict, planned, onPress, onToggle }: Props) {
  const { c } = useTheme();
  const courseLabel = useStore((s) => s.courses.find((course) => course.id === item.courseId)?.code);
  const isEvent = item.kind === 'event';
  const timeLabel = item.start ? (item.end ? formatRange(item.start, item.end) : formatTime(item.start)) : null;
  const categoryLabel = courseLabel || (item.category === 'school' ? 'Coursework' : item.category === 'work' ? 'Work' : 'Personal');
  const context = [categoryLabel, isEvent ? (item.end ? `Until ${formatTime(item.end)}` : null) : (item.isDeadline ? `Due${timeLabel ? ` at ${timeLabel}` : ''}` : timeLabel && !planned ? `Planned for ${timeLabel}` : null)].filter(Boolean).join(' · ');
  return (
    <View style={[styles.row, { borderBottomColor: c.line, backgroundColor: conflict ? c.conflictBg : 'transparent' }]}>
      <Pressable onPress={onPress} accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${item.title}, ${isEvent ? 'event' : 'to-do'}, ${timeLabel ?? (isEvent ? 'all day' : categoryLabel)}${item.done ? ', completed' : ''}${conflict ? ', schedule conflict' : ''}`}
        style={({ pressed }) => [styles.main, { opacity: pressed ? 0.65 : 1 }]}>
        <View style={styles.time}>
          <T token="caption" color={c.inkSecondary} tabular>{isEvent ? (item.start ? formatTime(item.start) : 'All day') : 'To do'}</T>
        </View>
        <View style={styles.title}>
          <T token="body" color={item.done ? c.inkSecondary : c.inkPrimary} style={item.done ? { textDecorationLine: 'line-through' } : undefined}>{item.title}</T>
          <T token="caption" color={c.inkSecondary}>{context}</T>
          {conflict ? <View style={styles.warning}><Icon name="alert" size={14} color={c.conflict} /><T token="caption" color={c.conflict}>Schedule conflict</T></View> : null}
        </View>
      </Pressable>
      {!isEvent ? <Pressable onPress={onToggle} disabled={!onToggle} accessibilityRole="checkbox"
        accessibilityLabel={`${item.done ? 'Mark incomplete' : 'Complete'}: ${item.title}`} accessibilityState={{ checked: item.done }}
        style={styles.checkTarget}>
        <Check done={item.done} />
      </Pressable> : null}
    </View>
  );
}

/** The completion circle fills and pops; the tick grows out of its centre. Driven by `done`, so undo plays it backwards. */
function Check({ done }: { done: boolean }) {
  const { c } = useTheme();
  const p = useSharedValue(done ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(done ? 1 : 0, springs.snappy);
  }, [done, p]);
  const ring = useAnimatedStyle(() => ({ transform: [{ scale: 1 + Math.max(0, 0.7 * p.value * (1 - p.value)) }] }));
  const fill = useAnimatedStyle(() => ({ opacity: Math.min(1, p.value), transform: [{ scale: 0.4 + 0.6 * p.value }] }));
  const tick = useAnimatedStyle(() => ({ opacity: Math.min(1, p.value), transform: [{ scale: Math.max(0, p.value) }] }));
  return (
    <Animated.View style={[styles.circle, { borderColor: done ? c.inkPrimary : c.controlOutline }, ring]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.fill, { backgroundColor: c.inkPrimary }, fill]} />
      <Animated.View style={tick}>
        <Icon name="tick" size={13} color={c.onPrimary} strokeWidth={2.5} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 72, borderBottomWidth: StyleSheet.hairlineWidth },
  main: { flex: 1, minWidth: 0, flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 16 },
  time: { width: 54, paddingTop: 2 },
  title: { flex: 1, minWidth: 0, gap: 4 },
  checkTarget: { width: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  circle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fill: { borderRadius: 11 },
  warning: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
