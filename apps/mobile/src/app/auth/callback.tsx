import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Sheet';
import { T } from '@/components/Text';
import { authErrorMessage } from '@/lib/auth';
import { completeAuthFromUrl, leaveAuth } from '@/lib/auth-client';
import { SCREEN_GUTTER, useTheme, space } from '@/theme';

/**
 * Where Google (and Apple, once set up) send the web back after sign-in. It trades the code in
 * the address for a session, restores the plan, and moves on. The iPhone finishes the same
 * redirect inside its sign-in sheet and never lands here.
 */
export default function AuthCallback() {
  const { c } = useTheme();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') { router.replace('/auth'); return; }
    void completeAuthFromUrl(window.location.href)
      .then(() => leaveAuth())
      .catch((failure: unknown) => setError(authErrorMessage(failure, 'auth.callback')));
  }, []);
  return (
    <View style={[styles.page, { backgroundColor: c.canvas }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {error ? <>
        <T token="title" accessibilityRole="header">We couldn’t sign you in.</T>
        <T token="body" color={c.inkSecondary}>{error}</T>
        <Button label="Back to sign in" onPress={() => router.replace('/auth/login')} />
      </> : <T token="body" color={c.inkSecondary} accessibilityRole="alert">Signing you in…</T>}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center', paddingHorizontal: SCREEN_GUTTER, gap: space.md, maxWidth: 480, width: '100%', alignSelf: 'center' },
});
