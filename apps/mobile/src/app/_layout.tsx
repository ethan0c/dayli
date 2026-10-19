import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Appearance } from 'react-native';
import * as Sentry from '@sentry/react-native';

import { configureNotifications, useReminderSync } from '@/lib/notifications';

import { PurchasesProvider } from '@/providers/PurchasesProvider';
import { useStore } from '@/store';
import { mobileFonts, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();
configureNotifications();

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
Sentry.init({ dsn: SENTRY_DSN, enabled: !!SENTRY_DSN, tracesSampleRate: 0.2, sendDefaultPii: false });

function RootLayout() {
  // Names match packages/tokens fontFamily / titleFamily / displayFamily.
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('../../assets/fonts/Inter_18pt-Regular.ttf'),
    'Inter-Medium': require('../../assets/fonts/Inter_18pt-Medium.ttf'),
    'Inter-SemiBold': require('../../assets/fonts/Inter_18pt-SemiBold.ttf'),
    'InterTitle-Medium': require('../../assets/fonts/Inter_24pt-Medium.ttf'),
    'InterDisplay-Regular': require('../../assets/fonts/Inter_28pt-Regular.ttf'),
    'InterDisplay-Medium': require('../../assets/fonts/Inter_28pt-Medium.ttf'),
    'InterDisplay-SemiBold': require('../../assets/fonts/Inter_28pt-SemiBold.ttf'),
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
            headerTitleStyle: { fontFamily: mobileFonts.semibold, fontSize: 17, color: c.inkPrimary },
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
