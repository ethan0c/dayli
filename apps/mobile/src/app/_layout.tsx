import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { addDays, localParts } from '@dayli/core';
import * as Sentry from '@sentry/react-native';

import { devCommand } from '@/lib/dev';
import { profileFor } from '@/lib/majors';
import { sampleWeek } from '@/store/sample';
import { configureNotifications, useReminderSync } from '@/lib/notifications';

import { PurchasesProvider } from '@/providers/PurchasesProvider';
import { useStore } from '@/store';
import { mobileFonts, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();
configureNotifications();

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
Sentry.init({ dsn: SENTRY_DSN, enabled: !!SENTRY_DSN, tracesSampleRate: 0.2, sendDefaultPii: false });

function RootLayout() {
  // Names match packages/tokens fontFamily.
  const [fontsLoaded, fontError] = useFonts({
    'Geist-Light': require('../../assets/fonts/Geist-Light.ttf'),
    'Geist-Regular': require('../../assets/fonts/Geist-Regular.ttf'),
    'Geist-Medium': require('../../assets/fonts/Geist-Medium.ttf'),
    'Geist-SemiBold': require('../../assets/fonts/Geist-SemiBold.ttf'),
  });
  const hydrated = useStore((s) => s.hydrated);
  const onboarded = useStore((s) => s.settings.onboarded);
  const appearance = useStore((s) => s.settings.appearance);
  const { c, dark } = useTheme();
  const ready = (fontsLoaded || !!fontError) && hydrated;
  useReminderSync();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // Development: a command file in Documents seeds a state for screenshots (see lib/dev.ts).
  useEffect(() => {
    if (!ready) return;
    void devCommand().then((cmd) => {
      if (!cmd) return;
      const store = useStore.getState();
      const today = localParts(new Date()).date;
      if (cmd === 'sample' || cmd === 'moment' || cmd === 'item') {
        store.setSettings({ onboarded: true, seeded: true, isStudent: true, major: 'nursing', breaks: cmd === 'moment' ? [{ label: 'Fall break', start: addDays(today, 9), end: addDays(today, 13) }] : [] });
        if (Object.keys(store.items).length === 0) {
          const week = sampleWeek(today, profileFor('nursing', true), true);
          useStore.setState({ items: Object.fromEntries(week.items.map((i) => [i.id, i])), courses: week.courses, schedules: week.schedules });
        }
      }
      if (cmd === 'item') {
        const first = Object.values(useStore.getState().items).find((i) => i.kind === 'event' && i.date >= today);
        if (first) setTimeout(() => router.push(`/item/${first.id}`), 600);
      }
    });
  }, [ready]);

  // Native views (tab bar, SwiftUI pickers) follow this; our tokens follow it through useTheme.
  useEffect(() => {
    Appearance.setColorScheme(appearance === 'system' ? 'unspecified' : appearance);
  }, [appearance]);

  if (!ready) return null;

  const theme = dark ? DarkTheme : DefaultTheme;
  return (
    <PurchasesProvider>
      <ThemeProvider value={{ ...theme, colors: { ...theme.colors, background: c.canvas } }}>
        <Stack
          screenOptions={{
            // Screens opt in with <Stack.Screen options={{ headerShown: true }} /> (the Sheet does this).
            headerShown: false,
            headerStyle: { backgroundColor: c.canvas },
            headerShadowVisible: false,
            headerTintColor: c.inkPrimary,
            headerTitleStyle: { fontFamily: mobileFonts.medium, fontSize: 16, color: c.inkPrimary },
            headerTitleAlign: 'center',
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: c.canvas },
          }}>
          {/* Review is a full-screen cover: it can be reached from onboarding too, so it sits outside the guards. */}
          <Stack.Screen name="review" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Protected guard={!onboarded}>
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          </Stack.Protected>
          <Stack.Protected guard={onboarded}>
            <Stack.Screen name="(tabs)" />
            {/* Flows slide up as full-screen covers with an X; detail screens push with a back chevron. */}
            <Stack.Screen name="capture" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="create" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="item/[id]" />
            <Stack.Screen name="settings" />
          </Stack.Protected>
        </Stack>
        <StatusBar style={dark ? 'light' : 'dark'} />
      </ThemeProvider>
    </PurchasesProvider>
  );
}

export default Sentry.wrap(RootLayout);
