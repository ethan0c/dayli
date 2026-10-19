import { Text, type TextProps } from 'react-native';

import { textStyle, useTheme, type TypeToken } from '@/theme';

type Props = TextProps & { token?: TypeToken; color?: string; tabular?: boolean };

export function T({ token = 'body', color, tabular, style, ...rest }: Props) {
  const { c } = useTheme();
  return (
    <Text
      {...rest}
      style={[textStyle(token, color ?? c.inkPrimary), tabular ? { fontVariant: ['tabular-nums'] } : null, style]}
    />
  );
}
