import type { ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { palettes } from '@dayli/tokens';

import { reportError } from '@/lib/errors';
import { space, size } from '@/theme';

/** Uses system text so recovery also works when fonts or the normal screen failed to load. */
export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => { reportError('screen.render', error); }, [error]);
  return <RecoveryScreen title="We couldn’t open this screen." message="Please try again. If it keeps happening, close and reopen Semli." onRetry={retry} />;
}

export function RecoveryScreen({ title, message, onRetry, actionLabel = 'Try again' }: { title: string; message: string; onRetry: () => void | Promise<void>; actionLabel?: string }) {
  const c = palettes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  useEffect(() => { void SplashScreen.hideAsync().catch((error: unknown) => reportError('screen.hide_splash', error)); }, []);
  return <View style={{ flex: 1, justifyContent: 'center', padding: space.xxl, gap: space.md, backgroundColor: c.canvas }}>
    <Text accessibilityRole="header" style={{ color: c.inkPrimary, fontSize: 30, lineHeight: 36, fontWeight: '400' }}>{title}</Text>
    <Text style={{ color: c.inkSecondary, fontSize: 16, lineHeight: 22 }}>{message}</Text>
    <Pressable accessibilityRole="button" onPress={() => { void Promise.resolve().then(onRetry).catch((failure: unknown) => reportError('screen.retry', failure)); }} style={{ minHeight: size.compact, justifyContent: 'center' }}>
      <Text style={{ color: c.accentInk, fontSize: 16 }}>{actionLabel}</Text>
    </Pressable>
  </View>;
}
