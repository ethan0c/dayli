import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type Session } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { create } from 'zustand';
import { reportError } from './errors';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY;

/** Accounts exist only when the project keys are set; without them Semli is guest-only. */
export const supabase = URL && KEY
  ? createClient(URL, KEY, {
      auth: {
        storage: Platform.OS === 'web' && typeof window === 'undefined' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    })
  : null;

/** The signed-in session, or null for a guest. `ready` once the stored session has been read. */
export const useSession = create<{ session: Session | null; ready: boolean }>(() => ({ session: null, ready: !supabase }));

if (supabase) {
  void supabase.auth.getSession().then(({ data, error }) => {
    if (error) reportError('auth.restore_session', error);
    useSession.setState({ session: data.session, ready: true });
  }).catch((error: unknown) => {
    reportError('auth.restore_session', error);
    useSession.setState({ ready: true });
  });
  supabase.auth.onAuthStateChange((_event, session) => useSession.setState({ session, ready: true }));
  // Refresh tokens only while the app is in the foreground (Supabase's React Native guidance).
  if (Platform.OS !== 'web') {
    AppState.addEventListener('change', (state) => {
      if (state === 'active') void supabase.auth.startAutoRefresh().catch((error: unknown) => reportError('auth.start_refresh', error));
      else void supabase.auth.stopAutoRefresh().catch((error: unknown) => reportError('auth.stop_refresh', error));
    });
  }
}
