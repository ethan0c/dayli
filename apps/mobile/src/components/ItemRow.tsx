import { formatRange, formatTime } from '@dayli/core';
import type { Item } from '@dayli/schema';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { T } from '@/components/Text';
import { radius, useTheme } from '@/theme';

type Props = {
  item: Pick<Item, 'kind' | 'title' | 'category' | 'icon' | 'start' | 'end' | 'done' | 'isDeadline'>;
  conflict?: boolean;
  onPress?: () => void;
  onToggle?: () => void;
};

/** Tasks are neutral rows with a check circle; events are tinted by category with a time chip. */
export function ItemRow({ item, conflict, onPress, onToggle }: Props) {
  const { c } = useTheme();
  const isEvent = item.kind === 'event';
  const cat = c.category[item.category];
  const bg = isEvent ? cat.fill : c.row;
  const ink = isEvent ? cat.ink : c.inkPrimary;
  const timeLabel = item.start ? (item.end ? formatRange(item.start, item.end) : formatTime(item.start)) : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: bg, opacity: item.done ? 0.55 : pressed ? 0.85 : 1 },
        conflict ? { borderWidth: 1.5, borderColor: c.conflict } : null,
      ]}>
      <Icon name={item.icon} color={ink} />
      <T
        numberOfLines={1}
        color={ink}
        style={[styles.title, item.done ? { textDecorationLine: 'line-through' } : null]}>
        {item.title}
      </T>
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
          onPress={onToggle}
          style={[
            styles.circle,
            item.done
              ? { backgroundColor: c.inkPrimary, borderColor: c.inkPrimary }
              : { backgroundColor: c.canvas, borderColor: c.line },
          ]}>
          {item.done ? <Icon name="tick" size={13} color={c.canvas} strokeWidth={3} /> : null}
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    borderRadius: radius.row,
    paddingHorizontal: 14,
  },
  title: { flex: 1, minWidth: 0 },
  chip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.chip },
  circle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
