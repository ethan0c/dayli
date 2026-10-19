import { monthDay, weekdayLong } from '@dayli/core';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T } from '@/components/Text';
import { SCREEN_GUTTER, useTheme } from '@/theme';

/** The same date, label, and large-value positions on every main tab. */
export function TabHeader({ date, label, context, title, value, details, trailing, onPress, accessibilityLabel, inset = true }: {
  date: string;
  label: string;
  context?: ReactNode;
  title?: string;
  value?: ReactNode;
  details?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  inset?: boolean;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const dateLabel = `${weekdayLong(date)}, ${monthDay(date)}`;
  const content = (
    <>
      {context ?? <View style={styles.labels}>
        <T token="callout" color={c.inkSecondary}>{dateLabel}</T>
        <T token="callout" color={c.inkSecondary} numberOfLines={1}>{label}</T>
      </View>}
      {value ?? <T token="displayXl" accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{title}</T>}
      {details ? <View style={styles.details}>{details}</View> : null}
    </>
  );
  return (
    <View style={[styles.root, { paddingTop: inset ? insets.top + 20 : 8 }]}>
      {onPress ? (
        <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ? `${dateLabel}, ${accessibilityLabel}` : undefined} onPress={onPress}
          style={({ pressed }) => [styles.content, { opacity: pressed ? 0.7 : 1 }]}>
          {content}
        </Pressable>
      ) : <View style={styles.content}>{content}</View>}
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: SCREEN_GUTTER, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  content: { flex: 1, minWidth: 0, gap: 6 },
  labels: { minHeight: 44, gap: 2 },
  details: { paddingTop: 6, gap: 4 },
  trailing: { paddingTop: 2, flexShrink: 0 },
});
