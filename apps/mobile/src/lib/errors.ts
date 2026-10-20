import { errorDiagnostic } from '@dayli/core';

import { posthogLogs } from '@/lib/analytics';

const reported = new WeakSet<object>();

/** Log once at the failure boundary. Only sanitized, allowlisted diagnostics leave this function. */
export function reportError(operation: string, error: unknown): void {
  try {
    if (error && typeof error === 'object') {
      if (reported.has(error)) return;
      reported.add(error);
    }
    const details = errorDiagnostic(error);
    console.info('[Semli error]', { operation, ...details });
    posthogLogs.error('operation_failed', {
      operation,
      error_name: details.name,
      has_error_code: Boolean(details.code),
    });
    if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
      void import('@sentry/react-native').then(({ captureException }) => {
        const safe = new Error(details.message);
        safe.name = details.name;
        if (details.stack) safe.stack = `${safe.name}: ${safe.message}\n${details.stack}`;
        captureException(safe, { tags: { operation, ...(details.code ? { error_code: details.code } : {}) }, extra: { status: details.status } });
      }).catch(() => { /* Diagnostic transport must never break the user's action. */ });
    }
  } catch { /* Logging must not replace the original failure or break recovery. */ }
}

/** Unknown exceptions get action-specific copy, never their raw message. */
export function friendlyError(error: unknown, fallback: string, operation: string): string {
  reportError(operation, error);
  return fallback;
}

export async function withErrorLogging<T>(operation: string, action: () => Promise<T>): Promise<T> {
  try { return await action(); }
  catch (error) { reportError(operation, error); throw error; }
}
