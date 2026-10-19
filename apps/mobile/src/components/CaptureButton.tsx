import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/components/Icon';
import { SCREEN_GUTTER, useTheme } from '@/theme';

export interface AddButtonProps { bottom: number; expanded: boolean; onPress: () => void }

export function AddButton({ bottom, expanded, onPress }: AddButtonProps) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Add to your plan" accessibilityState={{ expanded }} onPress={onPress}
      style={({ pressed }) => [styles.button, { bottom, backgroundColor: c.inkPrimary, opacity: pressed ? 0.8 : 1 }]}>
      <Icon name={expanded ? 'x' : 'plus'} size={24} color={c.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { position: 'absolute', right: SCREEN_GUTTER, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
