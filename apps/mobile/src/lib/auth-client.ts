import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

import { ACCOUNTS_ENABLED, AuthUnavailableError, unavailableClient, type AuthClient, type SignInResult } from './auth';
import { restoreFromCloud } from './cloud';
import { supabase } from './supabase';
import { useStore } from '../store';

WebBrowser.maybeCompleteAuthSession();

const callbackUrl = () => Linking.createURL('auth/callback');

/** Every sign-in ends here: pull the backed-up plan into this phone. */
async function signedIn(): Promise<SignInResult> {
  const { restored } = await restoreFromCloud().catch(() => ({ restored: false }));
  return { signedIn: true, restored };
}

/** A redirect back from Google or an email link: `?code=` (PKCE) or `?error_code=`. */
export async function completeAuthFromUrl(url: string): Promise<SignInResult> {
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1).split('#')[0]! : '';
  const params = new URLSearchParams(query);
  const errorCode = params.get('error_code');
  if (errorCode) throw { code: errorCode };
  const code = params.get('code');
  if (!code) throw new Error('No code in the redirect.');
  const { error } = await supabase!.auth.exchangeCodeForSession(code);
  if (error) throw error;
  return signedIn();
}

const supabaseClient: AuthClient = {
  async signIn({ email, password }) {
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return signedIn();
  },

  async signUp({ name, email, password }) {
    const { data, error } = await supabase!.auth.signUp({
      email,
      password,
      options: { data: name ? { full_name: name } : undefined, emailRedirectTo: callbackUrl() },
    });
    if (error) throw error;
    if (name && !useStore.getState().settings.name) useStore.getState().setSettings({ name });
    // With email confirmation on, the session arrives through the link instead.
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

  async signInWithApple() {
    if (Platform.OS !== 'ios') throw new AuthUnavailableError('Apple sign-in works on iPhone.');
    const raw = Crypto.randomUUID();
    const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
    let credential: AppleAuthentication.AppleAuthenticationCredential;
    try {
      credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
        nonce: hashed,
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
      throw error;
    }
    if (!credential.identityToken) throw new Error('No identity token from Apple.');
    const { error } = await supabase!.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken, nonce: raw });
    if (error) throw error;
    // Apple sends the name only on the first sign-in.
    const given = credential.fullName?.givenName;
    if (given) {
      const full = [given, credential.fullName?.familyName].filter(Boolean).join(' ');
      void supabase!.auth.updateUser({ data: { full_name: full } });
      if (!useStore.getState().settings.name) useStore.getState().setSettings({ name: given });
    }
    return signedIn();
  },

  async resetPassword(email) {
    const { error } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo: Linking.createURL('auth/reset-password') });
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
    await Purchases.logOut().catch(() => {});
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

/** Where to go after a successful sign-in: back to the planner, or on to onboarding for a new phone. */
export function leaveAuth() {
  if (useStore.getState().settings.onboarded) router.dismissTo('/');
  else router.replace('/onboarding?step=role');
}
