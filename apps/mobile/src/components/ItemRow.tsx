import { localParts } from '@dayli/core';
import type { Item } from '@dayli/schema';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { CategoryDot, IconButton, StatusPill, itemStatus } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { SwipeRow } from '@/components/SwipeRow';
import { T } from '@/components/Text';
import { useWebLayout } from '@/lib/layout';
import { springs } from '@/lib/motion';
import { courseTint, useStore } from '@/store';
import { useTheme } from '@/theme';

type RowItem = Pick<Item, 'kind' | 'title' | 'category' | 'icon' | 'start' | 'end' | 'done' | 'isDeadline' | 'date' | 'urgent'> & { id?: string; courseId?: string | null; employer?: string | null };
type Props = { item: RowItem; conflict?: boolean; planned?: boolean; today?: string; onPress?: () => void; onToggle?: () => void; onDelete?: () => void; last?: boolean };

/**
 * One agenda row: a check (to-dos) or a category dot (events), the title with its context,
 * and a status pill on the right. A class's to-dos draw their check ring in its tint, as its
 * events lead with a dot in it, so a week reads by course at a glance without a tinted card.
 * Swipe right to complete a to-do, left to delete, when the handlers are given. On the web a
 * pointer can't swipe: the row highlights under it and Delete takes the pill's place.
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
  const sub = [where, conflict ? 'Overlaps something else' : null, planned ? 'Working on it today' : null].filter(Boolean).join(' · ');
  const [hover, setHover] = useState(false);
  const pointer = Platform.OS === 'web';
  // Touch rows are 64 tall; a pointer on a wide window needs less (desktop lists run 44–52).
  const { sidebar } = useWebLayout();
  return (
    <SwipeRow onDelete={onDelete} completed={item.done} onComplete={!isEvent && onToggle ? () => {
      // A swipe is easy to make by accident, so completing one offers Undo; the check needs none.
      const completing = !item.done;
      onToggle();
      if (completing && item.id) useStore.getState().showDoneToast([{ id: item.id, title: item.title }]);
    } : undefined}>
    <View onPointerEnter={pointer ? () => setHover(true) : undefined} onPointerLeave={pointer ? () => setHover(false) : undefined}
      style={[styles.row, sidebar ? { minHeight: 52 } : null, { backgroundColor: hover ? c.row : c.canvas }, !last ? { borderBottomColor: c.line, borderBottomWidth: StyleSheet.hairlineWidth } : null]}>
      {!isEvent ? (
        <Pressable onPress={onToggle} disabled={!onToggle} accessibilityRole="checkbox" hitSlop={8}
          accessibilityLabel={`${item.done ? 'Mark incomplete' : 'Complete'}: ${item.title}`} accessibilityState={{ checked: item.done }} style={styles.checkTarget}>
          <Check done={item.done} color={course ? tint : undefined} />
        </Pressable>
      ) : (
        <View style={styles.checkTarget}><CategoryDot color={tint} /></View>
      )}
      <Pressable onPress={onPress} accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${item.title}, ${isEvent ? 'event' : 'to-do'}, ${status.label}${item.urgent ? ', urgent' : ''}${conflict ? ', overlaps another event' : ''}${item.done ? ', completed' : ''}`}
        style={({ pressed }) => [styles.main, { opacity: pressed ? 0.6 : 1 }]}>
        <View style={styles.text}>
          <T token="body" color={item.done ? c.inkSecondary : conflict ? c.conflict : c.inkPrimary} numberOfLines={2} style={item.done ? styles.done : undefined}>{item.title}</T>
          <View style={styles.sub}>
            <T token="caption" color={c.inkSecondary} numberOfLines={1} style={styles.subText}>{item.urgent ? <T token="caption" color={item.done ? c.inkSecondary : c.conflict}>Urgent · </T> : null}{sub}</T>
          </View>
        </View>
        {hover && onDelete ? null : <StatusPill label={status.label} tone={status.tone} />}
      </Pressable>
      {hover && onDelete ? <IconButton icon="trash" label={`Delete ${item.title}`} size={36} haptic="remove" onPress={onDelete} /> : null}
    </View>
    </SwipeRow>
  );
}

/**
 * The completion circle stays fixed while its fill and tick grow into place. With `color` (a
 * course's tint) the open ring wears it, a little heavier so the hue reads; done is always green.
 */
export function Check({ done, color }: { done: boolean; color?: string }) {
  const { c } = useTheme();
  const p = useSharedValue(done ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(done ? 1 : 0, springs.snappy);
  }, [done, p]);
  const fill = useAnimatedStyle(() => ({ opacity: Math.min(1, p.value), transform: [{ scale: 0.4 + 0.6 * p.value }] }));
  const tick = useAnimatedStyle(() => ({ opacity: Math.min(1, p.value), transform: [{ scale: Math.max(0, p.value) }] }));
  return (
    <View style={[styles.circle, { borderColor: done ? c.added : color ?? c.controlOutline }, color && !done ? { borderWidth: 2 } : null]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.fill, { backgroundColor: c.added }, fill]} />
      <Animated.View style={tick}>
        <Icon name="tick" size={13} color={c.onPrimary} strokeWidth={2.5} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64 },
  checkTarget: { width: 22, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  main: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  text: { flex: 1, minWidth: 0, gap: 2 },
  sub: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subText: { flexShrink: 1 },
  done: { textDecorationLine: 'line-through' },
  circle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fill: { borderRadius: 11 },
});
