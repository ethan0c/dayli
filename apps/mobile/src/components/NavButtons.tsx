import { t } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { motion } from '@dayli/tokens';

import { GLASS, GlassCircle } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { useTheme, iconSize, space, size } from '@/theme';

/** The parent navigator can handle Back even when this is the first screen in a nested stack. */
export function backOrHome() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** One native glass item on iOS 26; one circular control on other platforms. */
export function navigationButtonOptions(kind: 'close' | 'back', onPress: () => void = backOrHome) {
  const label = kind === 'close' ? t`Close` : t`Back`;
  return {
    // The desktop web header (ColumnHeader) draws this as a small link above a left-aligned title.
    webBack: { kind, onPress },
    headerBackVisible: false,
    headerLeft: GLASS ? undefined : () => kind === 'close' ? <CloseButton onPress={onPress} /> : <BackButton onPress={onPress} />,
    unstable_headerLeftItems: GLASS ? () => [{
      type: 'button' as const,
      label,
      accessibilityLabel: label,
      icon: { type: 'sfSymbol' as const, name: kind === 'close' ? 'xmark' as const : 'chevron.left' as const },
      hidesSharedBackground: false,
      onPress,
    }] : undefined,
  };
}

/** The X on the left of a full-screen cover's native header. */
export function CloseButton({ onPress }: { onPress?: () => void }) {
  const { t } = useLingui();
  const { c } = useTheme();
  return (
    <Press accessibilityRole="button" accessibilityLabel={t`Close`} hitSlop={8} scale={motion.press.iconScale} onPress={onPress ?? backOrHome} style={styles.button}>
      <GlassCircle size={36}><Icon name="x" size={22} color={c.inkPrimary} /></GlassCircle>
    </Press>
  );
}

/** A glass back chevron, including the first screen of a nested stack. */
export function BackButton({ onPress }: { onPress?: () => void }) {
  const { t } = useLingui();
  const { c } = useTheme();
  return (
    <Press accessibilityRole="button" accessibilityLabel={t`Back`} hitSlop={8} scale={motion.press.iconScale} onPress={onPress ?? backOrHome} style={styles.button}>
      <GlassCircle size={36}><Icon name="chevronLeft" size={iconSize.nav} color={c.inkPrimary} /></GlassCircle>
    </Press>
  );
}

const styles = StyleSheet.create({
  button: { minWidth: 44, minHeight: size.target, alignItems: 'center', justifyContent: 'center', marginLeft: -space.snug },
});
