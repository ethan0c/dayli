import { PostHog } from 'posthog-react-native';

/**
 * Product analytics. Events carry counts and kinds, never titles or content.
 * Expo embeds EXPO_PUBLIC_ variables at build time.
 */
const projectToken = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST;

if (!projectToken && __DEV__) {
  console.error('EXPO_PUBLIC_POSTHOG_KEY variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once EXPO_PUBLIC_POSTHOG_KEY is configured');
}

if (!host && __DEV__) {
  console.error('EXPO_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once EXPO_PUBLIC_POSTHOG_HOST is configured');
}

export const posthog: PostHog | null = projectToken && host
  ? new PostHog(projectToken, {
    host,
    captureAppLifecycleEvents: true,
    logs: {
      serviceName: 'dayli-mobile',
      environment: __DEV__ ? 'development' : 'production',
    },
    errorTracking: {
      autocapture: {
        uncaughtExceptions: true,
        unhandledRejections: true,
      },
    },
  })
  : null;

export type AnalyticsEvent =
  | 'onboarding_step'
  | 'onboarding_completed'
  | 'import_started'
  | 'import_succeeded'
  | 'import_failed'
  | 'review_committed'
  | 'paywall_shown'
  | 'purchase_completed'
  | 'purchase_restored'
  | 'review_requested'
  | 'reminders_permission'
  | 'reminders_changed'
  | 'briefing_changed'
  | 'canvas_synced'
  | 'canvas_sync_failed'
  | 'manual_item_created'
  | 'item_completion_changed'
  | 'item_deleted'
  | 'auth_completed'
  | 'account_signed_out'
  | 'first_note'
  | 'can_do'
  | 'voice_started'
  | 'voice_stopped'
  | 'voice_failed';

export function track(event: AnalyticsEvent, properties: Record<string, string | number | boolean | null> = {}): void {
  if (posthog) {
    void posthog.capture(event, properties);
  } else if (__DEV__) {
    console.log(`[analytics] ${event}`, properties);
  }
}

export function screen(name: string): void {
  if (posthog) void posthog.screen(name);
}

export const posthogLogs = {
  info(message: string, attributes: Record<string, string | number | boolean> = {}): void {
    posthog?.logger.info(message, attributes);
  },
  error(message: string, attributes: Record<string, string | number | boolean> = {}): void {
    posthog?.logger.error(message, attributes);
  },
};
