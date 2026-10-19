import { monthDay, weekdayLong } from '@dayli/core';
import { Pressable, StyleSheet, View } from 'react-native';

import { T } from '@/components/Text';
import { Ticker } from '@/components/Ticker';
import { useTheme } from '@/theme';

/** The time rolls over digit by digit when the minute changes, like a balance updating. */
export function ClockHeader({ time, date, onPressDate }: { time: string; date: string; onPressDate?: () => void }) {
  const { c } = useTheme();
  const [h, m] = time.split(':');
  const hour = Number(h) % 12 === 0 ? 12 : Number(h) % 12;
  return (
    <View style={styles.row}>
      <Ticker value={`${hour}:${m}`} token="displayXl" style={{ fontSize: 48, lineHeight: 56 }} maxFontSizeMultiplier={72 / 48} accessibilityLabel={`${hour}:${m}`} />
      <Pressable onPress={onPressDate} style={styles.date} accessibilityRole={onPressDate ? 'button' : undefined} accessibilityLabel="Jump to today">
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 4, paddingBottom: 24 },
  date: { paddingBottom: 6 },
  right: { textAlign: 'right' },
});
