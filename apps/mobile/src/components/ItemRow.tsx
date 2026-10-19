import { formatRange, formatTime } from '@dayli/core';
import type { Item } from '@dayli/schema';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { T } from '@/components/Text';
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
        <View style={[styles.circle, { backgroundColor: item.done ? c.inkPrimary : 'transparent', borderColor: item.done ? c.inkPrimary : c.controlOutline }]}>
          {item.done ? <Icon name="tick" size={13} color={c.onPrimary} strokeWidth={2.5} /> : null}
        </View>
      </Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 72, borderBottomWidth: StyleSheet.hairlineWidth },
  main: { flex: 1, minWidth: 0, flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 16 },
  time: { width: 54, paddingTop: 2 },
  title: { flex: 1, minWidth: 0, gap: 4 },
  checkTarget: { width: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  circle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  warning: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
