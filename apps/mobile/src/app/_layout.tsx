import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, Appearance, LogBox } from 'react-native';
import { I18nProvider } from '@lingui/react';
import { PostHogProvider } from 'posthog-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { addDays, localParts } from '@dayli/core';
import * as Sentry from '@sentry/react-native';
import * as Application from 'expo-application';
import { palettes } from '@dayli/tokens';

import { syncRingingAlarms } from '@/lib/alarms';
import { AppErrorBoundary, RecoveryScreen } from '@/components/AppErrorBoundary';
import { StorageWarning } from '@/components/StorageWarning';
import { reportError } from '@/lib/errors';
import { useStorageStatus } from '@/lib/storage';
import { CanvasAutoSync } from '@/lib/canvas-sync';
import { CloudBackup } from '@/lib/cloud';
import { devClock, devCommand, setDevAutoConfirm } from '@/lib/dev';
import { i18n } from '@/lib/i18n';
import { SHOWCASE, SKY, preloadPhotos } from '@/lib/images';
import { skySlot } from '@/lib/sky';
import { useDateLocaleSync } from '@/lib/locale';
import { setDevTime } from '@/lib/now';
import { hideSplash } from '@/lib/splash';
import { sampleScheduleExtraction, sampleScheduleUpdate, sampleSyllabusExtraction, sampleWeek } from '@/store/sample';
import { configureNotifications, useReminderSync } from '@/lib/notifications';

import { PurchasesProvider } from '@/providers/PurchasesProvider';
import { navigationButtonOptions } from '@/components/NavButtons';
import { useStore } from '@/store';
import { mobileFonts, useTheme } from '@/theme';
import { posthog, posthogLogs } from '@/lib/analytics';

// NativeTabs sends PRELOAD and ROUTE_NAMES_CHANGED actions the stack has no handler for; the
// warnings are noise (nothing is lost) and their toast sits at the bottom of every dev recording.
if (__DEV__) LogBox.ignoreLogs([/^The action '(PRELOAD|ROUTE_NAMES_CHANGED)'/]);

SplashScreen.preventAutoHideAsync();
const SPLASH_FALLBACK_MS = 1500;
configureNotifications();

export { AppErrorBoundary as ErrorBoundary };
export const unstable_settings = { screenErrorBoundary: AppErrorBoundary };

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
Sentry.init({
  dsn: SENTRY_DSN,
  enabled: !!SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  // Matches the name the Expo plugin uploads source maps and dSYMs under, so frames resolve.
  release: `${Application.applicationId}@${Application.nativeApplicationVersion}+${Application.nativeBuildVersion}`,
  dist: Application.nativeBuildVersion ?? undefined,
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  sendDefaultPii: false,
});

function AnalyticsRoot({ children }: { children: ReactNode }) {
  return posthog ? <PostHogProvider client={posthog}>{children}</PostHogProvider> : <>{children}</>;
}

function RootLayout() {
  // Names match packages/tokens fontFamily.
  const [fontsLoaded, fontError] = useFonts({
    'Geist-Light': require('../../assets/fonts/Geist-Light.ttf'),
    'Geist-Regular': require('../../assets/fonts/Geist-Regular.ttf'),
    'Geist-Medium': require('../../assets/fonts/Geist-Medium.ttf'),
    'Geist-SemiBold': require('../../assets/fonts/Geist-SemiBold.ttf'),
    'EBGaramond-Regular': require('../../assets/fonts/EBGaramond-Regular.ttf'),
  });
  const hydrated = useStore((s) => s.hydrated);
  const loadFailed = useStorageStatus((s) => s.loadFailed);
  const onboarded = useStore((s) => s.settings.onboarded);
  const appearance = useStore((s) => s.settings.appearance);
  const { c, dark } = useTheme();
  const pathname = usePathname();
  const photoPaywall = pathname === '/paywall' || pathname === '/settings/plan';
  // Photos the first screen shows are decoded behind the splash, at most 300 ms: Today's sky for
  // a returning person, the onboarding showcases and the Plus photo for a new one.
  const [photosReady, setPhotosReady] = useState(false);
  useEffect(() => {
    if (!hydrated) return;
    const sources = onboarded ? [SKY[skySlot(localParts(new Date()).time, dark)], SHOWCASE.plus] : [SHOWCASE.demo, SHOWCASE.headsup, SHOWCASE.plus];
    void preloadPhotos(sources).finally(() => setPhotosReady(true));
    // Once per launch: later sky changes fade in on their own.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);
  const ready = (fontsLoaded || !!fontError) && hydrated && photosReady;
  useDateLocaleSync(hydrated);
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
    if (!ready) return;
    posthogLogs.info('app_ready', { app_state: 'hydrated' });
    if (useStore.getState().settings.onboarded) { hideSplash(); return; }
    // A new install opens on the welcome, which hides the splash once its own logo sits exactly
    // under it. The timer only covers a launch that lands somewhere else, such as a deep link.
    const fallback = setTimeout(hideSplash, SPLASH_FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, [ready]);

  // Development: a command file in Documents seeds a state for screenshots (see lib/dev.ts).
  useEffect(() => {
    if (!ready) return;
    void Promise.all([devClock(), devCommand()]).then(([clock, cmd]) => {
      setDevTime(clock);
      if (!cmd) return;
      const store = useStore.getState();
      // A clock with a day ("2026-10-19 09:41") seeds the week around that day.
      const today = /^\d{4}-\d{2}-\d{2}/.exec(clock ?? '')?.[0] ?? localParts(new Date()).date;
      const demo = cmd === 'demo' || cmd === 'demo-syllabus';
      if (cmd === 'sample' || cmd === 'moment' || cmd === 'item' || cmd === 'review' || cmd === 'review-update' || cmd === 'hours' || cmd === 'list' || demo) {
        // Every first-time tip counts as seen, so the captures show the screens without them.
        store.setSettings({ onboarded: true, seeded: true, isStudent: true, major: 'nursing', firsts: { overlap: true, urgent: true, canvas: true, reimport: true, hours: true, week: true }, ...(cmd === 'hours' || cmd === 'list' ? { todayView: cmd } : {}), breaks: cmd === 'moment' ? [{ label: 'Fall break', start: addDays(today, 9), end: addDays(today, 13) }] : [] });
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
    <I18nProvider i18n={i18n}>
    <AnalyticsRoot>
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
          {/* On a new install it is the first screen and takes over the splash logo, so it must not slide up. */}
          <Stack.Screen name="auth" options={{ presentation: 'fullScreenModal', animation: onboarded ? 'default' : 'none' }} />
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
    </AnalyticsRoot>
    </I18nProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
