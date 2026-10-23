import { Platform } from 'react-native';

import { ACCOUNTS_ENABLED } from './auth';

/**
 * Development only: `?guest` keeps the old guest welcome in this tab, so screens can be checked
 * without signing in. Remembered for the tab, since links inside the app drop the query.
 */
function devGuest(): boolean {
  if (!__DEV__ || Platform.OS !== 'web' || typeof window === 'undefined') return false;
  try {
    if (new URLSearchParams(window.location.search).has('guest')) window.sessionStorage.setItem('semli.dev-guest', '1');
    return window.sessionStorage.getItem('semli.dev-guest') === '1';
  } catch {
    return false;
  }
}

/** The web asks for an account: a laptop's plan comes from the account, so there is no guest plan there. */
export const ACCOUNT_REQUIRED = Platform.OS === 'web' && ACCOUNTS_ENABLED && !devGuest();

/**
 * Sign in with Apple on the web needs a Services ID and return URL in the Apple developer account,
 * and Supabase's Apple provider set up for it. Until then the web offers Google and email.
 */
export const APPLE_ON_WEB = Platform.OS === 'web' && process.env.EXPO_PUBLIC_APPLE_WEB_SIGNIN === 'true';

/** "this iPhone" or "this browser", for copy about where a plan is. */
export const THIS_DEVICE = Platform.OS === 'web' ? 'this browser' : 'this iPhone';
export const THIS_DEVICE_TITLE = Platform.OS === 'web' ? 'This browser' : 'This iPhone';
/** What "match the system" is called: the iPhone's own setting, or the computer's. */
export const SYSTEM_NAME = Platform.OS === 'web' ? 'system' : 'iPhone';
