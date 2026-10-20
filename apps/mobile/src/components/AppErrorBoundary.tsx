import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { palettes } from '@dayli/tokens';

import { reportError } from '@/lib/errors';

/** Uses system text so recovery also works when fonts or the normal screen failed to load. */
export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const c = palettes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  useEffect(() => { reportError('screen.render', error); }, [error]);
  return <View style={{ flex: 1, justifyContent: 'center', padding: 32, gap: 18, backgroundColor: c.canvas }}>
    <Text accessibilityRole="header" style={{ color: c.inkPrimary, fontSize: 30, lineHeight: 36, fontWeight: '400' }}>We couldn’t open this screen.</Text>
    <Text style={{ color: c.inkSecondary, fontSize: 16, lineHeight: 22 }}>Please try again. If it keeps happening, close and reopen Semli.</Text>
    <Pressable accessibilityRole="button" onPress={() => { void retry().catch((failure: unknown) => reportError('screen.retry', failure)); }} style={{ minHeight: 48, justifyContent: 'center' }}>
      <Text style={{ color: c.accentInk, fontSize: 16 }}>Try again</Text>
    </Pressable>
  </View>;
}
