import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, Appearance, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { addDays, localParts } from '@dayli/core';
import * as Sentry from '@sentry/react-native';
import { palettes } from '@dayli/tokens';

import { syncRingingAlarms } from '@/lib/alarms';
import { AppErrorBoundary, RecoveryScreen } from '@/components/AppErrorBoundary';
import { StorageWarning } from '@/components/StorageWarning';
import { reportError } from '@/lib/errors';
import { useStorageStatus } from '@/lib/storage';
import { CanvasAutoSync } from '@/lib/canvas-sync';
import { CloudBackup } from '@/lib/cloud';
import { devClock, devCommand, setDevAutoConfirm } from '@/lib/dev';
import { setDevTime } from '@/lib/now';
import { sampleScheduleExtraction, sampleScheduleUpdate, sampleSyllabusExtraction, sampleWeek } from '@/store/sample';
import { configureNotifications, useReminderSync } from '@/lib/notifications';

import { PurchasesProvider } from '@/providers/PurchasesProvider';
import { navigationButtonOptions } from '@/components/NavButtons';
import { useStore } from '@/store';
import { mobileFonts, useTheme } from '@/theme';

// NativeTabs sends PRELOAD and ROUTE_NAMES_CHANGED actions the stack has no handler for; the
// warnings are noise (nothing is lost) and their toast sits at the bottom of every dev recording.
if (__DEV__) LogBox.ignoreLogs([/^The action '(PRELOAD|ROUTE_NAMES_CHANGED)'/]);

SplashScreen.preventAutoHideAsync();
configureNotifications();

export { AppErrorBoundary as ErrorBoundary };
export const unstable_settings = { screenErrorBoundary: AppErrorBoundary };

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
Sentry.init({ dsn: SENTRY_DSN, enabled: !!SENTRY_DSN, tracesSampleRate: 0.2, sendDefaultPii: false });

function RootLayout() {
  // Names match packages/tokens fontFamily.
  const [fontsLoaded, fontError] = useFonts({
    'Geist-Light': require('../../assets/fonts/Geist-Light.ttf'),
    'Geist-Regular': require('../../assets/fonts/Geist-Regular.ttf'),
    'Geist-Medium': require('../../assets/fonts/Geist-Medium.ttf'),
    'Geist-SemiBold': require('../../assets/fonts/Geist-SemiBold.ttf'),
    'Newsreader-Regular': require('../../assets/fonts/Newsreader-Regular.ttf'),
  });
  const hydrated = useStore((s) => s.hydrated);
  const loadFailed = useStorageStatus((s) => s.loadFailed);
  const onboarded = useStore((s) => s.settings.onboarded);
  const appearance = useStore((s) => s.settings.appearance);
  const { c, dark } = useTheme();
  const pathname = usePathname();
  const photoPaywall = pathname === '/paywall' || pathname === '/settings/plan';
  const ready = (fontsLoaded || !!fontError) && hydrated;
  useEffect(() => { if (fontError) reportError('fonts.load', fontError); }, [fontError]);
  useReminderSync();
  const alarmItems = useStore((s) => s.items);
  const alarmsEnabled = useStore((s) => s.settings.reminders.urgentAlarmsEnabled);
  useEffect(() => {
    if (!hydrated) return;
    void syncRingingAlarms().catch(() => {});
  }, [hydrated, alarmItems, alarmsEnabled]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && useStore.getState().hydrated) void syncRingingAlarms().catch(() => {});
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // Development: a command file in Documents seeds a state for screenshots (see lib/dev.ts).
  useEffect(() => {
    if (!ready) return;
    void devClock().then(setDevTime);
    void devCommand().then((cmd) => {
      if (!cmd) return;
      const store = useStore.getState();
      const today = localParts(new Date()).date;
      const demo = cmd === 'demo' || cmd === 'demo-syllabus';
      if (cmd === 'sample' || cmd === 'moment' || cmd === 'item' || cmd === 'review' || cmd === 'review-update' || cmd === 'hours' || cmd === 'list' || demo) {
        store.setSettings({ onboarded: true, seeded: true, isStudent: true, major: 'nursing', ...(cmd === 'hours' || cmd === 'list' ? { todayView: cmd } : {}), breaks: cmd === 'moment' ? [{ label: 'Fall break', start: addDays(today, 9), end: addDays(today, 13) }] : [] });
        if (Object.keys(store.items).length === 0) {
          const week = sampleWeek(today, { student: true, preview: true });
          useStore.setState({ items: Object.fromEntries(week.items.map((i) => [i.id, i])), courses: week.courses, schedules: week.schedules });
        }
        // A fresh install opened the welcome cover before the settings changed; Today is under it.
        setTimeout(() => router.navigate('/'), 400);
      }
      if (cmd === 'plus') {
        // Back into onboarding, where dev-step.txt = plus opens the paywall page without a cover.
        store.setSettings({ onboarded: false, seeded: true, isStudent: true, major: 'nursing' });
        if (Object.keys(store.items).length === 0) {
          const week = sampleWeek(today, { student: true, preview: true });
          useStore.setState({ items: Object.fromEntries(week.items.map((i) => [i.id, i])), courses: week.courses, schedules: week.schedules });
        }
      }
      if (cmd === 'review' || cmd === 'review-update') {
        store.setPending({ extraction: (cmd === 'review' ? sampleScheduleExtraction : sampleScheduleUpdate)(today), source: 'Screenshot' });
        setTimeout(() => router.push('/review'), 2500);
      }
      // A recording: Today, then the Add tab, then the review of a screenshot or a syllabus,
      // which confirms itself and lands on Plan. Every transition is the real one.
      if (demo) {
        store.setSettings({ remindersAsked: true });
        setDevAutoConfirm(7000);
        setTimeout(() => router.navigate('/add'), 3000);
        setTimeout(() => {
          store.setPending(cmd === 'demo'
            ? { extraction: sampleScheduleExtraction(today), source: 'Screenshot' }
            : { extraction: sampleSyllabusExtraction(today), source: 'NURS210-syllabus.pdf' });
          router.push('/review');
        }, 6500);
      }
      if (cmd === 'item') {
        const first = Object.values(useStore.getState().items).find((i) => i.kind === 'event' && i.date >= today);
        if (first) setTimeout(() => router.push(`/item/${first.id}`), 2500);
      }
    });
  }, [ready]);

  // Native views (tab bar, SwiftUI pickers) follow this; our tokens follow it through useTheme.
  useEffect(() => {
    Appearance.setColorScheme(appearance === 'system' ? 'unspecified' : appearance);
  }, [appearance]);

  if (loadFailed) return <RecoveryScreen title="We couldn’t open your saved plan." message="Please try again. If this keeps happening, close and reopen Semli. Your saved data hasn’t been replaced." onRetry={() => useStore.persist.rehydrate()} />;
  if (!ready) return null;

  const theme = dark ? DarkTheme : DefaultTheme;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <PurchasesProvider>
      <CanvasAutoSync />
      <CloudBackup />
      <ThemeProvider value={{ ...theme, colors: { ...theme.colors, background: c.canvas } }}>
        <StorageWarning />
        <Stack
          screenOptions={{
            // Sheet screens (review, create, item) declare headerShown below; a full-screen cover
            // that turns its header on after mounting lays out without it and slides under the status bar.
            headerShown: false,
            headerStyle: { backgroundColor: c.canvas },
            headerShadowVisible: false,
            headerTintColor: c.inkPrimary,
            headerTitleStyle: { fontFamily: mobileFonts.medium, fontSize: 16, color: c.inkPrimary },
            headerTitleAlign: 'center',
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: c.canvas },
          }}>
          {/* Auth is the fallback for a new install; existing planners still resolve / to tabs. */}
          <Stack.Screen name="auth" options={{ presentation: 'fullScreenModal' }} />
          {/* Review is a full-screen cover: it can be reached from onboarding too, so it sits outside the guards. */}
          <Stack.Screen name="review" options={{ presentation: 'fullScreenModal', gestureEnabled: false, headerShown: true, ...navigationButtonOptions('close') }} />
          <Stack.Screen name="paywall" options={{ presentation: 'fullScreenModal', headerShown: true, headerTransparent: true, headerStyle: { backgroundColor: 'transparent' }, contentStyle: { backgroundColor: palettes.dark.canvas }, title: '', headerTintColor: palettes.dark.inkPrimary, ...navigationButtonOptions('close') }} />
          <Stack.Screen name="account" options={{ presentation: 'fullScreenModal', headerShown: true, ...navigationButtonOptions('close') }} />
          <Stack.Protected guard={!onboarded}>
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          </Stack.Protected>
          <Stack.Protected guard={onboarded}>
            <Stack.Screen name="(tabs)" />
            {/* Legacy capture links redirect to Add without presenting an empty modal. */}
            <Stack.Screen name="capture" />
            {/* Flows slide up as full-screen covers with an X; detail screens push with a back chevron. */}
            <Stack.Screen name="create" options={{ presentation: 'fullScreenModal', headerShown: true, ...navigationButtonOptions('close') }} />
            <Stack.Screen name="share-schedule" options={{ presentation: 'fullScreenModal', headerShown: true, ...navigationButtonOptions('close') }} />
            <Stack.Screen name="item/[id]" options={{ headerShown: true, ...navigationButtonOptions('back') }} />
            <Stack.Screen name="course/[id]" options={{ headerShown: true, ...navigationButtonOptions('back') }} />
            <Stack.Screen name="employer/[name]" options={{ headerShown: true, ...navigationButtonOptions('back') }} />
            <Stack.Screen name="import/[id]" options={{ headerShown: true, ...navigationButtonOptions('back') }} />
            <Stack.Screen name="settings" />
          </Stack.Protected>
        </Stack>
        {/* One owner restores the theme's icons when leaving either always-dark paywall. */}
        <StatusBar style={photoPaywall || dark ? 'light' : 'dark'} hidden={false} />
      </ThemeProvider>
    </PurchasesProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
