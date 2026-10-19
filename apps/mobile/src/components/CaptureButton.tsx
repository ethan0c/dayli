import { StyleSheet } from 'react-native';

import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { SCREEN_GUTTER, useTheme } from '@/theme';

export interface AddButtonProps { bottom: number; expanded: boolean; onPress: () => void }

export function AddButton({ bottom, expanded, onPress }: AddButtonProps) {
  const { c } = useTheme();
  return (
    <Press accessibilityRole="button" accessibilityLabel="Add to your plan" accessibilityState={{ expanded }} onPress={onPress} scale={0.92}
      style={[styles.button, { bottom, backgroundColor: c.inkPrimary }]}>
      <Icon name={expanded ? 'x' : 'plus'} size={24} color={c.onPrimary} />
    </Press>
  );
}

const styles = StyleSheet.create({
  button: { position: 'absolute', right: SCREEN_GUTTER, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
