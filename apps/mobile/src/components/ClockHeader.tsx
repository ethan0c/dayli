import { monthDay, weekdayLong } from '@dayli/core';
import { Pressable, StyleSheet, View } from 'react-native';

import { T } from '@/components/Text';
import { useTheme } from '@/theme';

export function ClockHeader({ time, date, onPressDate }: { time: string; date: string; onPressDate?: () => void }) {
  const { c } = useTheme();
  const [h, m] = time.split(':');
  const hour = Number(h) % 12 === 0 ? 12 : Number(h) % 12;
  return (
    <View style={styles.row}>
      <T token="displayXl" tabular>
        {hour}:{m}
      </T>
      <Pressable onPress={onPressDate} style={styles.date} accessibilityLabel="Jump to today">
        <T token="callout" color={c.inkPrimary} style={styles.right}>
          {monthDay(date)}
        </T>
        <T token="callout" color={c.inkPrimary} style={styles.right}>
          {weekdayLong(date)}
        </T>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 4, paddingBottom: 14 },
  date: { paddingBottom: 6 },
  right: { textAlign: 'right' },
});
