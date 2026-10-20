import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { reportError } from '@/lib/errors';
import { useTheme } from '@/theme';

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
  if (!available) return null;
  return (
    <View pointerEvents={disabled ? 'none' : 'auto'} accessibilityState={{ disabled }} style={{ opacity: disabled ? 0.5 : 1 }}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={dark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={26} style={{ width: '100%', height: 52 }}
        accessibilityState={{ disabled }}
        onPress={() => { if (!disabled) onPress(); }} />
    </View>
  );
}
