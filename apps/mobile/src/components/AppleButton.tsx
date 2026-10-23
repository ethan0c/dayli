import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Press } from '@/components/Press';
import { T } from '@/components/Text';
import { reportError } from '@/lib/errors';
import { APPLE_ON_WEB } from '@/lib/web';
import { useTheme, fade, space } from '@/theme';

/** Apple's own control supplies the approved typography, logo, localization and accessibility. */
export function AppleButton({ onPress, disabled = false }: { onPress: () => void; disabled?: boolean }) {
  const { dark } = useTheme();
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let active = true;
    void AppleAuthentication.isAvailableAsync().then((value) => {
      if (active) setAvailable(value);
    }).catch((error: unknown) => reportError('auth.apple.availability', error));
    return () => { active = false; };
  }, []);
  if (APPLE_ON_WEB) return <WebAppleButton onPress={onPress} disabled={disabled} />;
  if (!available) return null;
  return (
    <View pointerEvents={disabled ? 'none' : 'auto'} accessibilityState={{ disabled }} style={{ opacity: disabled ? fade.disabled : 1 }}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={dark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={26} style={{ width: '100%', height: 52 }}
        accessibilityState={{ disabled }}
        onPress={() => { if (!disabled) onPress(); }} />
    </View>
  );
}

/** The web's Apple button, drawn to Apple's guidelines: black (white in dark mode), the logo, "Continue with Apple". */
function WebAppleButton({ onPress, disabled }: { onPress: () => void; disabled: boolean }) {
  const { dark } = useTheme();
  const ink = dark ? '#000000' : '#FFFFFF';
  return (
    <Press accessibilityRole="button" accessibilityLabel="Continue with Apple" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={[styles.web, { backgroundColor: dark ? '#FFFFFF' : '#000000', opacity: disabled ? fade.disabled : 1 }]}>
      <View aria-hidden>
        <Svg width={16} height={20} viewBox="0 0 814 1000">
          <Path fill={ink} d="M788 341c-6 4-108 62-108 190 0 148 130 200 134 202-1 3-21 72-69 142-43 62-88 123-156 123s-86-40-164-40c-77 0-104 41-167 41s-106-57-156-128C44 788 0 670 0 557c0-181 118-277 234-277 62 0 113 41 152 41 37 0 95-43 165-43 27 0 123 2 187 63zM554 172c29-35 50-83 50-131 0-7-1-13-2-19-47 2-104 32-138 72-27 30-52 78-52 127 0 7 1 15 2 17 3 1 8 1 13 1 43 0 97-29 127-67z" />
        </Svg>
      </View>
      <T token="headline" color={ink}>Continue with Apple</T>
    </Press>
  );
}

const styles = StyleSheet.create({
  web: { minHeight: 52, paddingHorizontal: space.lg, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, alignSelf: 'stretch' },
});
