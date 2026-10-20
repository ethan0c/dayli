import { useRef, useState } from 'react';
import { Stack, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoogleButton } from '@/components/AuthControls';
import { AppleButton } from '@/components/AppleButton';
import { TextButton } from '@/components/Controls';
import { navigationButtonOptions } from '@/components/NavButtons';
import { Button } from '@/components/Sheet';
import { T } from '@/components/Text';
import { Wordmark } from '@/components/Wordmark';
import { ACCOUNTS_ENABLED, authErrorMessage } from '@/lib/auth';
import { authClient, leaveAuth } from '@/lib/auth-client';
import { enter } from '@/lib/motion';
import { useStore } from '@/store';
import { SCREEN_GUTTER, useTheme } from '@/theme';

/** Semli's first screen; choosing guest continues to the first onboarding question. */
export default function AuthWelcomeScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const onboarded = useStore((s) => s.settings.onboarded);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const signIn = async (provider: 'google' | 'apple') => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const result = await (provider === 'apple' ? authClient.signInWithApple() : authClient.signInWithGoogle());
      if (result?.signedIn) { leaveAuth(); return; }
    } catch (error) { setNotice(authErrorMessage(error, `auth.${provider}`)); }
    setBusy(false);
    lock.current = false;
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <Stack.Screen options={{ headerShown: onboarded, title: '', ...navigationButtonOptions('close') }} />
      <ScrollView contentContainerStyle={[styles.page, { paddingTop: onboarded ? 24 : insets.top + 24, paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.hero}>
          <Animated.View entering={enter.rise}><Wordmark width={192} ink={c.inkPrimary} dot={c.accent} /></Animated.View>
          <Animated.View entering={enter.fade} style={styles.copy}>
            <T token="display" style={styles.center} accessibilityRole="header">The daily planner for college students.</T>
            <T token="callout" color={c.inkSecondary} style={styles.center}>Drop in a syllabus, a work schedule, or a text. Semli tells you what matters today.</T>
          </Animated.View>
        </View>
        <Animated.View entering={enter.rise} style={styles.actions}>
          {!ACCOUNTS_ENABLED ? <Button label="Get started" onPress={leaveAuth} /> : <>
          {notice ? <T token="callout" color={c.conflict} accessibilityRole="alert" style={styles.center}>{notice}</T> : null}
          <AppleButton onPress={() => void signIn('apple')} disabled={busy} />
          <GoogleButton onPress={() => void signIn('google')} disabled={busy} />
          <Button label="Sign up with email" disabled={busy} onPress={() => router.push('/auth/signup')} />
          <TextButton label="Already have an account? Log in" tone="muted" disabled={busy} onPress={() => router.push('/auth/login')} style={styles.textAction} />
          <View style={[styles.guest, { borderTopColor: c.line }]}>
            <TextButton label="Continue as a guest" tone="muted" disabled={busy} onPress={leaveAuth} style={styles.textAction} />
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
