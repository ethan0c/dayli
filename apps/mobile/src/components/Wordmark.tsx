import { fontFamily, lavender } from '@dayli/tokens';
import { StyleSheet, Text, View } from 'react-native';

/** The dayli. wordmark: Onest SemiBold with the i's tittle and the period as lavender dots. */
export function Wordmark({ size = 32, ink }: { size?: number; ink: string }) {
  const dot = size * 0.19;
  const text = { fontFamily: fontFamily.semibold, fontSize: size, lineHeight: size * 1.1, letterSpacing: -size * 0.045, color: ink };
  return (
    <View style={styles.row} accessibilityRole="image" accessibilityLabel="dayli">
      <Text style={text}>dayl</Text>
      <View>
        <Text style={text}>ı</Text>
        <View style={[styles.dot, { width: dot, height: dot, borderRadius: dot / 2, left: '50%', marginLeft: -dot / 2, top: size * 0.06 }]} />
      </View>
      <View style={[styles.dot, styles.period, { width: dot, height: dot, borderRadius: dot / 2, marginLeft: size * 0.05, marginBottom: size * 0.1 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  dot: { position: 'absolute', backgroundColor: lavender[500] },
  period: { position: 'relative' },
});
