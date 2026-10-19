import type { TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet } from 'react-native';

import { Icon, type IconKey } from '@/components/Icon';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { radius, useTheme } from '@/theme';

type Props = Omit<TabTriggerSlotProps, 'ref'> & {
  icon: IconKey;
  label: string;
  ref?: React.ComponentProps<typeof Pressable>['ref'];
};

/** One segment of the floating nav pill. Active: light pill with icon and label. Inactive: icon only. */
export function NavButton({ icon, label, isFocused, onPress, ...props }: Props) {
  const { c } = useTheme();
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
      style={[styles.seg, isFocused ? { backgroundColor: c.canvas } : null]}>
      <Icon name={icon} size={18} color={isFocused ? c.inkPrimary : c.navInactive} />
      {isFocused ? (
        <T token="subhead" color={c.inkPrimary}>
          {label}
        </T>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  seg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
});
