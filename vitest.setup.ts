import { vi } from 'vitest';

// The app's analytics module creates the PostHog React Native client, which cannot load in
// Node. Error reporting imports it, so every mobile test gets this no-op stand-in.
vi.mock('./apps/mobile/src/lib/analytics.ts', () => ({
  posthog: null,
  track: () => undefined,
  profile: () => undefined,
  screen: () => undefined,
  posthogLogs: { info: () => undefined, error: () => undefined },
}));
