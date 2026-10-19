import { useEffect } from 'react';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { springs } from '@/lib/motion';
import { textStyle, useTheme, type TypeToken } from '@/theme';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * A number that rolls to its new value, one digit column at a time, the way a
 * brokerage balance does. Non-digit characters (":", "·", letters) sit still.
 * Digits are tabular, so columns never shift width.
 */
export function Ticker({ value, token = 'body', color, style, accessibilityLabel, maxFontSizeMultiplier }: { value: string; token?: TypeToken; color?: string; style?: TextStyle; accessibilityLabel?: string; maxFontSizeMultiplier?: number }) {
  const { c } = useTheme();
  const base: TextStyle = { ...textStyle(token, color ?? c.inkPrimary), fontVariant: ['tabular-nums'], ...style };
  const line = base.lineHeight ?? (base.fontSize ?? 16) * 1.2;
  return (
    <View style={styles.row} accessible accessibilityRole="text" accessibilityLabel={accessibilityLabel ?? value}>
      {[...value].map((ch, i) =>
        DIGITS.includes(ch) ? (
          <Digit key={`${i}-${value.length}`} digit={Number(ch)} line={line} style={base} maxFontSizeMultiplier={maxFontSizeMultiplier} />
        ) : (
          <Text key={`${i}-${ch}`} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[base, { lineHeight: line }]}>
            {ch}
          </Text>
        ),
      )}
    </View>
  );
}

function Digit({ digit, line, style, maxFontSizeMultiplier }: { digit: number; line: number; style: TextStyle; maxFontSizeMultiplier?: number }) {
  const y = useSharedValue(-digit * line);
  useEffect(() => {
    y.value = withSpring(-digit * line, springs.gentle);
  }, [digit, line, y]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <View style={{ height: line, overflow: 'hidden' }}>
      <Animated.View style={animated}>
        {DIGITS.map((d) => (
          <Text key={d} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[style, { lineHeight: line }]}>
            {d}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'flex-end' } });
