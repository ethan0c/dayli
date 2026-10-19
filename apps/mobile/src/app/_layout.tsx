import { Urbanist_400Regular, Urbanist_500Medium, Urbanist_600SemiBold, useFonts } from '@expo-google-fonts/urbanist';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Appearance } from 'react-native';
import * as Sentry from '@sentry/react-native';

import { configureNotifications, useReminderSync } from '@/lib/notifications';

import { PurchasesProvider } from '@/providers/PurchasesProvider';
import { useStore } from '@/store';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();
configureNotifications();

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
Sentry.init({ dsn: SENTRY_DSN, enabled: !!SENTRY_DSN, tracesSampleRate: 0.2, sendDefaultPii: false });

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Urbanist_400Regular, Urbanist_500Medium, Urbanist_600SemiBold });
  const hydrated = useStore((s) => s.hydrated);
  const onboarded = useStore((s) => s.settings.onboarded);
  const appearance = useStore((s) => s.settings.appearance);
  const { c, dark } = useTheme();
  const ready = (fontsLoaded || !!fontError) && hydrated;
  useReminderSync();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
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
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.canvas } }}>
          <Stack.Screen name="review" options={{ presentation: 'modal', gestureEnabled: false }} />
          <Stack.Protected guard={!onboarded}>
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          </Stack.Protected>
          <Stack.Protected guard={onboarded}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="capture" options={{ presentation: 'modal' }} />
            <Stack.Screen name="create" options={{ presentation: 'modal' }} />
            <Stack.Screen name="item/[id]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
          </Stack.Protected>
        </Stack>
        <StatusBar style={dark ? 'light' : 'dark'} />
      </ThemeProvider>
    </PurchasesProvider>
  );
}

export default Sentry.wrap(RootLayout);
