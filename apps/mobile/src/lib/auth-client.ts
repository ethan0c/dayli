import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Purchases from 'react-native-purchases';

import { ACCOUNTS_ENABLED, unavailableClient, type AuthClient, type SignInResult } from './auth';
import { restoreFromCloud } from './cloud';
import { reportError } from './errors';
import { supabase } from './supabase';
import { useStore } from '../store';

WebBrowser.maybeCompleteAuthSession();

/** Only Google uses a redirect; email confirmation and reset use emailed codes. */
const callbackUrl = () => Linking.createURL('auth/callback');

/** Every sign-in ends here: pull the backed-up plan into this phone. */
async function signedIn(): Promise<SignInResult> {
  const { restored } = await restoreFromCloud().catch((error: unknown) => {
    reportError('cloud.restore_after_sign_in', error);
    const { settings, setSettings } = useStore.getState();
    setSettings({ cloud: { ...settings.cloud, error: 'You’re signed in, but we couldn’t restore your backup. Check your connection and try again. Your plan on this phone is still here.' } });
    return { restored: false };
  });
  return { signedIn: true, restored };
}

/** The redirect back from Google: `?code=` (PKCE) or `?error_code=`. */
export async function completeAuthFromUrl(url: string): Promise<SignInResult> {
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1).split('#')[0]! : '';
  const params = new URLSearchParams(query);
  const errorCode = params.get('error_code');
  if (errorCode) throw { code: errorCode };
  const code = params.get('code');
  if (!code) throw Object.assign(new Error('No code in the redirect.'), { code: 'oauth_callback_missing' });
  const { error } = await supabase!.auth.exchangeCodeForSession(code);
  if (error) throw error;
  return signedIn();
}

const supabaseClient: AuthClient = {
  async signIn({ email, password }) {
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) {
      // Signed up but never entered the code: send a fresh one and go to the code screen.
      if (error.code !== 'email_not_confirmed') throw error;
      try {
        const { error: resendError } = await supabase!.auth.resend({ type: 'signup', email });
        if (resendError) throw resendError;
      } catch (resendError) {
        reportError('auth.resend_before_confirmation', resendError);
        return { signedIn: false, confirmEmail: true, resendFailed: true };
      }
      return { signedIn: false, confirmEmail: true };
    }
    return signedIn();
  },

  async signUp({ name, email, password }) {
    const { data, error } = await supabase!.auth.signUp({
      email,
      password,
      options: { data: name ? { full_name: name } : undefined },
    });
    if (error) throw error;
    // With confirmation on, Supabase answers an existing email with a user that has no identities
    // and sends nothing, so the code screen would wait forever.
    if (data.user && data.user.identities?.length === 0) throw { code: 'user_already_exists' };
    if (name && !useStore.getState().settings.name) useStore.getState().setSettings({ name });
    // With email confirmation on, the session arrives once the emailed code is entered.
    if (!data.session) return { signedIn: false, confirmEmail: true };
    return signedIn();
  },

  async signInWithGoogle() {
    const redirectTo = callbackUrl();
    const { data, error } = await supabase!.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true } });
    if (error) throw error;
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return null;
    return completeAuthFromUrl(result.url);
  },

  async resetPassword(email) {
    const { error } = await supabase!.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  async verifyCode(email, code, purpose) {
    const { error } = await supabase!.auth.verifyOtp({ email, token: code, type: purpose });
    if (error) throw error;
    return signedIn();
  },

  async resendCode(email, purpose) {
    const { error } = purpose === 'signup'
      ? await supabase!.auth.resend({ type: 'signup', email })
      : await supabase!.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  async updatePassword(password) {
    const { error } = await supabase!.auth.updateUser({ password });
    if (error) throw error;
  },

  /** The plan stays on this phone; only the session and the purchase identity go. */
  async signOut() {
    const { error } = await supabase!.auth.signOut({ scope: 'local' });
    if (error) throw error;
    await Purchases.logOut().catch((error: unknown) => reportError('purchases.log_out', error));
    const { settings, setSettings } = useStore.getState();
    setSettings({ cloud: { ...settings.cloud, backedUpAt: null, error: null } });
  },

  async deleteAccount() {
    const { error } = await supabase!.rpc('delete_account');
    if (error) throw error;
    await supabaseClient.signOut();
  },
};

export const authClient: AuthClient = ACCOUNTS_ENABLED && supabase ? supabaseClient : unavailableClient;

/**
 * Leaving the auth screens, signed in or as a guest: back to the planner, or on to onboarding
 * for a phone that hasn't finished it. The whole auth cover goes, including any screens
 * under it, so one tap never lands back on a form.
 */
export function leaveAuth() {
  if (useStore.getState().settings.onboarded) router.dismissTo('/');
  else router.replace('/onboarding?step=role');
}
