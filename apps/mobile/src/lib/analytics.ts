import { PostHog } from 'posthog-react-native';

/**
 * Product analytics. Events carry counts and kinds, never titles or content.
 * Without EXPO_PUBLIC_POSTHOG_KEY nothing leaves the device; in development the
 * event is logged so the funnel can be checked by eye.
 */
const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

let client: PostHog | null = null;
if (KEY) {
  client = new PostHog(KEY, { host: HOST, captureAppLifecycleEvents: true });
}

export type AnalyticsEvent =
  | 'onboarding_completed'
  | 'import_started'
  | 'import_succeeded'
  | 'import_failed'
  | 'review_committed'
  | 'paywall_shown'
  | 'purchase_completed'
  | 'purchase_restored'
  | 'reminders_permission'
  | 'reminders_changed'
  | 'briefing_changed';

export function track(event: AnalyticsEvent, properties: Record<string, string | number | boolean | null> = {}): void {
  if (client) {
    void client.capture(event, properties);
  } else if (__DEV__) {
    console.log(`[analytics] ${event}`, properties);
  }
}

export function screen(name: string): void {
  if (client) void client.screen(name);
}
