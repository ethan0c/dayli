import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { reportError } from './errors';

/*
 * The account this phone last signed in with, for "Continue as Ethan · Apple" on the welcome
 * screen and "Last used" on sign-in. Never a token: the first name, the provider, and the email
 * masked for display. An email account also keeps its address so the sign-in form can be filled.
 * Forgotten on Delete account and on "Not you?".
 */

export type Provider = 'apple' | 'google' | 'email';
export interface LastAccount {
  firstName: string | null;
  provider: Provider;
  maskedEmail: string | null;
  /** Email accounts only, to fill the sign-in form. */
  email?: string;
}

const KEY = 'semli.last-account';
let listeners: ((a: LastAccount | null) => void)[] = [];

/** "e•••@gmail.com". Apple's private relay addresses are shown as is; they reveal nothing. */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const [name, domain] = email.split('@');
  if (!name || !domain) return null;
  return `${name[0]}•••@${domain}`;
}

export function providerLabel(p: Provider): string {
  return p === 'apple' ? 'Apple' : p === 'google' ? 'Google' : 'Email';
}

export async function readLastAccount(): Promise<LastAccount | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LastAccount) : null;
  } catch (error) {
    reportError('storage.last_account_read', error);
    return null;
  }
}

export async function rememberAccount(account: LastAccount): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(account));
    listeners.forEach((l) => l(account));
  } catch (error) {
    reportError('storage.last_account_save', error);
  }
}

export async function forgetAccount(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
    listeners.forEach((l) => l(null));
  } catch (error) {
    reportError('storage.last_account_forget', error);
  }
}

/** The remembered account, or null while loading and when there is none. */
export function useLastAccount(): LastAccount | null {
  const [account, setAccount] = useState<LastAccount | null>(null);
  useEffect(() => {
    let live = true;
    void readLastAccount().then((a) => { if (live) setAccount(a); });
    listeners.push(setAccount);
    return () => { live = false; listeners = listeners.filter((l) => l !== setAccount); };
  }, []);
  return account;
}
