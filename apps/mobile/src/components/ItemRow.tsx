import { formatRange, formatTime } from '@dayli/core';
import type { Item } from '@dayli/schema';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { T } from '@/components/Text';
import { courseTint, useStore } from '@/store';
import { radius, useTheme, type Palette } from '@/theme';

type RowItem = Pick<Item, 'kind' | 'title' | 'category' | 'icon' | 'start' | 'end' | 'done' | 'isDeadline'> & { courseId?: string | null };

type Props = {
  item: RowItem;
  conflict?: boolean;
  onPress?: () => void;
  onToggle?: () => void;
};

/** Events take their course's tint, or their category's; tasks stay neutral with a check circle. */
export function useItemColors(item: RowItem, c: Palette): { fill: string; ink: string } {
  const courses = useStore((s) => s.courses);
  if (item.kind !== 'event') return { fill: c.row, ink: c.inkPrimary };
  const tint = courseTint(courses, item.courseId);
  return tint ? c.tint[tint] : c.category[item.category];
}

export function ItemRow({ item, conflict, onPress, onToggle }: Props) {
  const { c } = useTheme();
  const { fill, ink } = useItemColors(item, c);
  const courseLabel = useStore((s) => s.courses.find((course) => course.id === item.courseId)?.code);
  const isEvent = item.kind === 'event';
  const timeLabel = item.start ? (item.end ? formatRange(item.start, item.end) : formatTime(item.start)) : null;
  const categoryLabel = courseLabel || (item.category === 'school' ? 'Coursework' : item.category === 'work' ? 'Work' : 'Personal');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${item.title}, ${isEvent ? 'event' : 'to-do'}, ${timeLabel ?? (isEvent ? 'all day' : categoryLabel)}${item.done ? ', completed' : ''}${conflict ? ', schedule conflict' : ''}`}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: fill, opacity: item.done ? 0.55 : pressed ? 0.85 : 1 },
        conflict ? { borderWidth: 1.5, borderColor: c.conflict } : null,
      ]}>
      <View style={[styles.icon, { backgroundColor: isEvent ? c.chip : c.surface }]}><Icon name={item.icon} size={19} color={ink} /></View>
      <View style={styles.title}>
        <T token="subhead" numberOfLines={2} color={ink} style={item.done ? { textDecorationLine: 'line-through' } : undefined}>{item.title}</T>
        <T token="caption" color={isEvent ? ink : c.inkSecondary}>{conflict ? 'Schedule conflict' : `${categoryLabel}${item.isDeadline ? ' · Deadline' : ''}`}</T>
      </View>
      {isEvent ? (
        timeLabel ? (
          <View style={[styles.chip, { backgroundColor: c.chip }]}>
            <T token="subhead" color={ink} tabular>
              {timeLabel}
            </T>
          </View>
        ) : null
      ) : (
        <Pressable
          hitSlop={12}
          onPress={(event) => { event.stopPropagation(); onToggle?.(); }}
          disabled={!onToggle}
          accessibilityLabel={`${item.done ? 'Mark incomplete' : 'Complete'}: ${item.title}`}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.done }}
          style={[
            styles.circle,
            item.done ? { backgroundColor: c.inkPrimary, borderColor: c.inkPrimary } : { backgroundColor: c.canvas, borderColor: c.line },
          ]}>
          {item.done ? <Icon name="tick" size={13} color={c.canvas} strokeWidth={3} /> : null}
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 74, borderRadius: radius.row, paddingHorizontal: 12, paddingVertical: 12 },
  icon: { width: 34, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, minWidth: 0, gap: 4 },
  chip: { maxWidth: '43%', paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.chip },
  circle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
