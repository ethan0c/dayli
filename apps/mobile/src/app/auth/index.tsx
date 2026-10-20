import { useState } from 'react';
import { Stack, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppleButton, GoogleButton } from '@/components/AuthControls';
import { TextButton } from '@/components/Controls';
import { navigationButtonOptions } from '@/components/NavButtons';
import { Button } from '@/components/Sheet';
import { T } from '@/components/Text';
import { Wordmark } from '@/components/Wordmark';
import { ACCOUNTS_ENABLED, authErrorMessage } from '@/lib/auth';
import { authClient, leaveAuth } from '@/lib/auth-client';
import { enter } from '@/lib/motion';
import { useStore } from '@/store';
import { SCREEN_GUTTER, textStyle, useTheme } from '@/theme';

/** Semli's first screen; choosing guest continues to the first onboarding question. */
export default function AuthWelcomeScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const onboarded = useStore((s) => s.settings.onboarded);
  const [notice, setNotice] = useState<string | null>(null);
  const start = () => { if (onboarded) router.dismissTo('/'); else router.replace('/onboarding?step=role'); };
  const social = async (provider: 'google' | 'apple') => {
    setNotice(null);
    try {
      const result = provider === 'google' ? await authClient.signInWithGoogle() : await authClient.signInWithApple();
      if (result?.signedIn) leaveAuth();
    } catch (error) { setNotice(authErrorMessage(error)); }
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <Stack.Screen options={{ headerShown: onboarded, title: '', ...navigationButtonOptions('close') }} />
      <ScrollView contentContainerStyle={[styles.page, { paddingTop: onboarded ? 24 : insets.top + 24, paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.hero}>
          <Animated.View entering={enter.rise}><Wordmark width={192} ink={c.inkPrimary} dot={c.accent} /></Animated.View>
          <Animated.View entering={enter.fade} style={styles.copy}>
            <T style={[textStyle('display', c.inkPrimary), styles.center]} accessibilityRole="header">The daily planner for college students.</T>
            <T token="callout" color={c.inkSecondary} style={styles.center}>Drop in a syllabus, a work schedule, or a text. Semli tells you what matters today.</T>
          </Animated.View>
        </View>
        <Animated.View entering={enter.rise} style={styles.actions}>
          {!ACCOUNTS_ENABLED ? <Button label="Get started" onPress={start} /> : <>
          {notice ? <T token="callout" color={c.conflict} accessibilityRole="alert" style={styles.center}>{notice}</T> : null}
          <AppleButton onPress={() => void social('apple')} />
          <GoogleButton onPress={() => void social('google')} />
          <Button label="Sign up with email" onPress={() => router.push('/auth/signup')} />
          <TextButton label="Already have an account? Log in" tone="muted" onPress={() => router.push('/auth/login')} style={styles.textAction} />
          <View style={[styles.guest, { borderTopColor: c.line }]}>
            <TextButton label="Continue as a guest" tone="muted" onPress={start} style={styles.textAction} />
            <T token="caption" color={c.inkSecondary} style={styles.center}>Start planning. An account is optional.</T>
          </View>
          </>}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, paddingHorizontal: SCREEN_GUTTER, gap: 32 },
  hero: { flex: 1, minHeight: 320, alignItems: 'center', justifyContent: 'center', gap: 32 },
  copy: { gap: 14, maxWidth: 330 },
  center: { textAlign: 'center' },
  actions: { gap: 14 },
  textAction: { alignSelf: 'center', minHeight: 44 },
  guest: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 4, paddingTop: 12, gap: 4 },
});
