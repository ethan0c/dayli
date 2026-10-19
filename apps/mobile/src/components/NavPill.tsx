import type { TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import { Icon, type IconKey } from '@/components/Icon';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { radius, useTheme } from '@/theme';

type Props = Omit<TabTriggerSlotProps, 'ref'> & {
  icon: IconKey;
  label: string;
  ref?: React.ComponentProps<typeof Pressable>['ref'];
};

/** Stable-width destinations keep labels visible as selection changes. */
export function NavButton({ icon, label, isFocused, onPress, ...props }: Props) {
  const { c } = useTheme();
  const { fontScale } = useWindowDimensions();
  return (
    <Pressable
      {...props}
      onPress={(e) => {
        if (!isFocused) feedback('select');
        onPress?.(e);
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      accessibilityLabel={label}
      style={[styles.seg, isFocused ? { backgroundColor: c.selectionFill } : null]}>
      <Icon name={icon} size={20} color={isFocused ? c.selectionInk : c.inkSecondary} />
      {fontScale < 1.6 ? (
        <T token="caption" maxFontSizeMultiplier={1.3} color={isFocused ? c.selectionInk : c.inkSecondary}>
          {label}
        </T>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  seg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minHeight: 48,
    paddingHorizontal: 3,
    borderRadius: radius.pill,
  },
});
