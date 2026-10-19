import { localParts } from '@dayli/core';
import type { Item } from '@dayli/schema';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { CategoryDot, StatusPill, itemStatus } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { SwipeRow } from '@/components/SwipeRow';
import { T } from '@/components/Text';
import { springs } from '@/lib/motion';
import { courseTint, useStore } from '@/store';
import { useTheme } from '@/theme';

type RowItem = Pick<Item, 'kind' | 'title' | 'category' | 'icon' | 'start' | 'end' | 'done' | 'isDeadline' | 'date'> & { courseId?: string | null; employer?: string | null };
type Props = { item: RowItem; conflict?: boolean; planned?: boolean; today?: string; onPress?: () => void; onToggle?: () => void; onDelete?: () => void; last?: boolean };

/**
 * One agenda row: a check (to-dos) or a category dot (events), the title with its context,
 * and a status pill on the right that is the only colored thing on the row.
 * Swipe right to complete a to-do, left to delete, when the handlers are given.
 */
export function ItemRow({ item, conflict, planned, today, onPress, onToggle, onDelete, last }: Props) {
  const { c } = useTheme();
  const courses = useStore((s) => s.courses);
  const course = item.courseId ? courses.find((k) => k.id === item.courseId) : undefined;
  const isEvent = item.kind === 'event';
  const date = today ?? localParts(new Date()).date;
  const status = itemStatus(item, date, conflict);
  const tint = course ? c.tint[courseTint(courses, course.id) ?? 'lavender'].ink : c.category[item.category].ink;
  const where = course?.code ?? item.employer ?? (item.category === 'school' ? 'Coursework' : item.category === 'work' ? 'Work' : 'Personal');
  const sub = [where, conflict ? 'overlaps something else' : null, planned ? 'working on it today' : null].filter(Boolean).join(' · ');
  return (
    <SwipeRow onDelete={onDelete} onComplete={!isEvent ? onToggle : undefined} completed={item.done}>
    <View style={[styles.row, { backgroundColor: c.canvas }, !last ? { borderBottomColor: c.line, borderBottomWidth: StyleSheet.hairlineWidth } : null]}>
      {!isEvent ? (
        <Pressable onPress={onToggle} disabled={!onToggle} accessibilityRole="checkbox" hitSlop={8}
          accessibilityLabel={`${item.done ? 'Mark incomplete' : 'Complete'}: ${item.title}`} accessibilityState={{ checked: item.done }} style={styles.checkTarget}>
          <Check done={item.done} />
        </Pressable>
      ) : (
        <View style={styles.checkTarget}><CategoryDot color={tint} /></View>
      )}
      <Pressable onPress={onPress} accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${item.title}, ${isEvent ? 'event' : 'to-do'}, ${status.label}${item.done ? ', completed' : ''}`}
        style={({ pressed }) => [styles.main, { opacity: pressed ? 0.6 : 1 }]}>
        <View style={styles.text}>
          <T token="body" color={item.done ? c.inkSecondary : c.inkPrimary} numberOfLines={2} style={item.done ? styles.done : undefined}>{item.title}</T>
          <T token="caption" color={c.inkSecondary} numberOfLines={1}>{sub}</T>
        </View>
        <StatusPill label={status.label} tone={status.tone} />
      </Pressable>
    </View>
    </SwipeRow>
  );
}

/** The completion circle: grey ring, fills green and pops; the tick grows out of the centre. */
export function Check({ done }: { done: boolean }) {
  const { c } = useTheme();
  const p = useSharedValue(done ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(done ? 1 : 0, springs.snappy);
  }, [done, p]);
  const ring = useAnimatedStyle(() => ({ transform: [{ scale: 1 + Math.max(0, 0.7 * p.value * (1 - p.value)) }] }));
  const fill = useAnimatedStyle(() => ({ opacity: Math.min(1, p.value), transform: [{ scale: 0.4 + 0.6 * p.value }] }));
  const tick = useAnimatedStyle(() => ({ opacity: Math.min(1, p.value), transform: [{ scale: Math.max(0, p.value) }] }));
  return (
    <Animated.View style={[styles.circle, { borderColor: done ? c.added : c.controlOutline }, ring]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.fill, { backgroundColor: c.added }, fill]} />
      <Animated.View style={tick}>
        <Icon name="tick" size={13} color="#FFFFFF" strokeWidth={2.5} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64 },
  checkTarget: { width: 22, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  main: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  text: { flex: 1, minWidth: 0, gap: 2 },
  done: { textDecorationLine: 'line-through' },
  circle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fill: { borderRadius: 11 },
});
