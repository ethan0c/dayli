import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthClient } from './auth';

/*
 * The sign-in flow end to end with the provider mocked: where each outcome lands (planner,
 * onboarding, the code screen), what the backup does to a new phone, and the error paths.
 */

type Listener = (state: Record<string, unknown>) => void;
function fakeStore<S extends Record<string, unknown>>(initial: () => S) {
  let state = initial();
  const listeners = new Set<Listener>();
  const api = {
    getState: () => state,
    setState: (patch: Partial<S> | ((s: S) => Partial<S>)) => {
      state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
      listeners.forEach((l) => l(state));
    },
    subscribe: (l: Listener) => { listeners.add(l); return () => listeners.delete(l); },
    reset: () => { state = initial(); },
  };
  return api;
}

const mocks = vi.hoisted(() => {
  const auth = {
    signInWithPassword: vi.fn(), signUp: vi.fn(), signInWithOAuth: vi.fn(), exchangeCodeForSession: vi.fn(),
    resetPasswordForEmail: vi.fn(), verifyOtp: vi.fn(), resend: vi.fn(), updateUser: vi.fn(), signOut: vi.fn(), getSession: vi.fn(),
  };
  const table = { maybeSingle: vi.fn(), upsert: vi.fn() };
  return {
    auth, table,
    supabase: { auth, rpc: vi.fn(), from: vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle: table.maybeSingle }) }), upsert: table.upsert })) },
    router: { dismissTo: vi.fn(), replace: vi.fn(), push: vi.fn() },
    browser: { maybeCompleteAuthSession: vi.fn(), openAuthSessionAsync: vi.fn() },
    purchases: { logOut: vi.fn() },
    store: null as unknown as ReturnType<typeof fakeStore>,
    session: null as unknown as ReturnType<typeof fakeStore>,
  };
});

vi.mock('expo-linking', () => ({ createURL: (path: string) => `semli://${path}` }));
vi.mock('expo-router', () => ({ router: mocks.router }));
vi.mock('expo-web-browser', () => mocks.browser);
vi.mock('react-native-purchases', () => ({ default: mocks.purchases }));
vi.mock('./supabase', () => ({ supabase: mocks.supabase, useSession: mocks.session }));
vi.mock('../store', () => ({ useStore: mocks.store }));

const DEFAULTS = () => ({
  name: '', seeded: false, onboarded: false, isStudent: true, major: null as string | null, weekKinds: [] as string[], lms: null,
  reminders: {}, breaks: [], planIntent: null, canvas: { feedUrl: null, lastSyncedAt: null, lastError: null }, cloud: { backedUpAt: null as string | null, error: null as string | null },
});
const item = (id: string) => ({ id, kind: 'task', title: id, category: 'school', icon: 'check', date: '2026-10-20', start: null, end: null, isDeadline: false, done: false, completedAt: null, courseId: null, employer: null, sourceId: null, batchId: null, notes: null, createdAt: '2026-10-01T00:00:00Z' });

const user = { id: 'u1', email: 'ama@example.com' };
const session = { user, access_token: 't' };
const fields = { email: 'ama@example.com', password: 'correct horse' };
const row = (over: object = {}) => ({ version: 1, items: [], courses: [], schedules: [], taskWorkDates: {}, settings: {}, ...over });

mocks.store = fakeStore(() => ({
  hydrated: true, items: {} as Record<string, unknown>, courses: [], schedules: [], taskWorkDates: {}, settings: DEFAULTS(), toast: null as unknown,
  setSettings: (patch: object) => mocks.store.setState((s) => ({ settings: { ...(s.settings as object), ...patch } })),
  showToast: (message: string) => mocks.store.setState({ toast: { message } }),
}));
mocks.session = fakeStore(() => ({ session: null as unknown, ready: true }));

let authClient: AuthClient;
let leaveAuth: () => void;
let completeAuthFromUrl: (url: string) => Promise<unknown>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('EXPO_PUBLIC_SUPABASE_KEY', 'publishable');
  mocks.store.reset();
  mocks.session.reset();
  // A sign-in that succeeds, with no backup row yet.
  mocks.auth.getSession.mockResolvedValue({ data: { session } });
  mocks.auth.signInWithPassword.mockResolvedValue({ data: { session, user }, error: null });
  mocks.table.maybeSingle.mockResolvedValue({ data: null, error: null });
  mocks.table.upsert.mockResolvedValue({ error: null });
  mocks.purchases.logOut.mockResolvedValue(undefined);
  ({ authClient, leaveAuth, completeAuthFromUrl } = await import('./auth-client'));
});
afterEach(() => vi.unstubAllEnvs());

const settings = () => mocks.store.getState().settings as ReturnType<typeof DEFAULTS>;
const saved = () => mocks.table.upsert.mock.calls.at(-1)![0] as { user_id: string; data: { items: { id: string }[]; onboarded: boolean; settings: { name: string } } };

describe('logging in on a new phone', () => {
  it('goes to onboarding when the account has no backup', async () => {
    expect(await authClient.signIn(fields)).toEqual({ signedIn: true, restored: false });
    expect(settings().onboarded).toBe(false);
    expect(saved()).toMatchObject({ user_id: 'u1', data: { onboarded: false } });
    leaveAuth();
    expect(mocks.router.replace).toHaveBeenCalledWith('/onboarding?step=role');
    expect(mocks.router.dismissTo).not.toHaveBeenCalled();
  });

  it('goes to onboarding, with the profile filled in, when the account signed up but never finished', async () => {
    // The row every sign-in writes: empty, from a phone that had not finished onboarding.
    mocks.table.maybeSingle.mockResolvedValue({ data: { data: row({ settings: { name: 'Ama', major: 'nursing' }, onboarded: false }) }, error: null });
    expect(await authClient.signIn(fields)).toEqual({ signedIn: true, restored: false });
    expect(settings()).toMatchObject({ onboarded: false, seeded: false, name: 'Ama', major: 'nursing' });
    leaveAuth();
    expect(mocks.router.replace).toHaveBeenCalledWith('/onboarding?step=role');
  });

  it('skips onboarding and lands in the planner when the account finished it elsewhere', async () => {
    mocks.table.maybeSingle.mockResolvedValue({ data: { data: row({ items: [item('a')], settings: { name: 'Ama' }, onboarded: true }) }, error: null });
    expect(await authClient.signIn(fields)).toEqual({ signedIn: true, restored: true });
    expect(settings()).toMatchObject({ onboarded: true, seeded: true, name: 'Ama' });
    expect(Object.keys(mocks.store.getState().items as object)).toEqual(['a']);
    expect(saved().data.items.map((i) => i.id)).toEqual(['a']);
    leaveAuth();
    expect(mocks.router.dismissTo).toHaveBeenCalledWith('/');
    expect(mocks.router.replace).not.toHaveBeenCalled();
  });

  it('treats a backup saved before the flag as finished only when it holds a plan', async () => {
    mocks.table.maybeSingle.mockResolvedValue({ data: { data: row({ items: [item('a')] }) }, error: null });
    await authClient.signIn(fields);
    expect(settings().onboarded).toBe(true);
    mocks.store.reset();
    mocks.table.maybeSingle.mockResolvedValue({ data: { data: row() }, error: null });
    await authClient.signIn(fields);
    expect(settings().onboarded).toBe(false);
  });

  it('still signs in when the backup cannot be read', async () => {
    mocks.table.maybeSingle.mockRejectedValue(new Error('offline'));
    expect(await authClient.signIn(fields)).toEqual({ signedIn: true, restored: false });
    expect(settings().onboarded).toBe(false);
    expect(mocks.session.getState().session).toBe(session);
  });
});

describe('logging in on a phone with a plan', () => {
  it('keeps this phone’s settings, adds what only the backup has, and returns to the planner', async () => {
    mocks.store.setState({ items: { b: item('b') }, settings: { ...DEFAULTS(), onboarded: true, seeded: true, name: 'Phone' } });
    mocks.table.maybeSingle.mockResolvedValue({ data: { data: row({ items: [item('a')], settings: { name: 'Cloud' }, onboarded: true }) }, error: null });
    await authClient.signIn(fields);
    expect(settings().name).toBe('Phone');
    expect(Object.keys(mocks.store.getState().items as object).sort()).toEqual(['a', 'b']);
    expect(saved().data).toMatchObject({ onboarded: true, settings: { name: 'Phone' } });
    leaveAuth();
    expect(mocks.router.dismissTo).toHaveBeenCalledWith('/');
  });

  it('as a guest, leaving the welcome goes to the planner once onboarded and to onboarding before', () => {
    leaveAuth();
    expect(mocks.router.replace).toHaveBeenCalledWith('/onboarding?step=role');
    mocks.store.setState({ settings: { ...DEFAULTS(), onboarded: true } });
    leaveAuth();
    expect(mocks.router.dismissTo).toHaveBeenCalledWith('/');
  });
});

describe('email login and sign-up', () => {
  it('surfaces a wrong password without touching the backup or navigating', async () => {
    mocks.auth.signInWithPassword.mockResolvedValue({ data: {}, error: { code: 'invalid_credentials', message: 'Invalid login credentials' } });
    await expect(authClient.signIn(fields)).rejects.toMatchObject({ code: 'invalid_credentials' });
    expect(mocks.table.upsert).not.toHaveBeenCalled();
    expect(mocks.router.replace).not.toHaveBeenCalled();
    expect(mocks.router.dismissTo).not.toHaveBeenCalled();
  });

  it('sends a fresh code and goes to the code screen when the email was never confirmed', async () => {
    mocks.auth.signInWithPassword.mockResolvedValue({ data: {}, error: { code: 'email_not_confirmed', message: 'Email not confirmed' } });
    mocks.auth.resend.mockResolvedValue({ error: null });
    expect(await authClient.signIn(fields)).toEqual({ signedIn: false, confirmEmail: true });
    expect(mocks.auth.resend).toHaveBeenCalledWith({ type: 'signup', email: fields.email });
  });

  it('still goes to the code screen when the fresh code hits the email rate limit', async () => {
    mocks.auth.signInWithPassword.mockResolvedValue({ data: {}, error: { code: 'email_not_confirmed' } });
    mocks.auth.resend.mockRejectedValue({ code: 'over_email_send_rate_limit' });
    expect(await authClient.signIn(fields)).toEqual({ signedIn: false, confirmEmail: true });
  });

  it('waits for the emailed code after sign-up and keeps the name on this phone', async () => {
    mocks.auth.signUp.mockResolvedValue({ data: { user: { ...user, identities: [{ id: 'i1' }] }, session: null }, error: null });
    expect(await authClient.signUp({ ...fields, name: 'Ama' })).toEqual({ signedIn: false, confirmEmail: true });
    expect(mocks.auth.signUp).toHaveBeenCalledWith({ email: fields.email, password: fields.password, options: { data: { full_name: 'Ama' } } });
    expect(settings().name).toBe('Ama');
    expect(mocks.table.upsert).not.toHaveBeenCalled();
  });

  it('never overwrites a name already on this phone', async () => {
    mocks.store.setState({ settings: { ...DEFAULTS(), name: 'Phone' } });
    mocks.auth.signUp.mockResolvedValue({ data: { user: { ...user, identities: [{ id: 'i1' }] }, session: null }, error: null });
    await authClient.signUp({ ...fields, name: 'Ama' });
    expect(settings().name).toBe('Phone');
  });

  it('tells someone with an account to log in instead of waiting for a code that never comes', async () => {
    // With confirmation on, Supabase answers an existing email with a user that has no identities.
    mocks.auth.signUp.mockResolvedValue({ data: { user: { ...user, identities: [] }, session: null }, error: null });
    const { authErrorMessage } = await import('./auth');
    await expect(authClient.signUp(fields)).rejects.toMatchObject({ code: 'user_already_exists' });
    await authClient.signUp(fields).catch((e) => expect(authErrorMessage(e)).toMatch(/Log in instead/));
    expect(settings().name).toBe('');
  });

  it('signs straight in when confirmation is off', async () => {
    mocks.auth.signUp.mockResolvedValue({ data: { user: { ...user, identities: [{ id: 'i1' }] }, session }, error: null });
    expect(await authClient.signUp(fields)).toEqual({ signedIn: true, restored: false });
  });
});

describe('the emailed code', () => {
  it('a sign-up code signs in and restores like a login', async () => {
    mocks.auth.verifyOtp.mockResolvedValue({ data: { session }, error: null });
    mocks.table.maybeSingle.mockResolvedValue({ data: { data: row({ items: [item('a')], onboarded: true }) }, error: null });
    expect(await authClient.verifyCode(fields.email, '123456', 'signup')).toEqual({ signedIn: true, restored: true });
    expect(mocks.auth.verifyOtp).toHaveBeenCalledWith({ email: fields.email, token: '123456', type: 'signup' });
    expect(settings().onboarded).toBe(true);
  });

  it('a reset code signs in so the new password can be saved', async () => {
    mocks.auth.verifyOtp.mockResolvedValue({ data: { session }, error: null });
    expect(await authClient.verifyCode(fields.email, '123456', 'recovery')).toEqual({ signedIn: true, restored: false });
    expect(mocks.auth.verifyOtp).toHaveBeenCalledWith({ email: fields.email, token: '123456', type: 'recovery' });
    mocks.auth.updateUser.mockResolvedValue({ error: null });
    await authClient.updatePassword('new password');
    expect(mocks.auth.updateUser).toHaveBeenCalledWith({ password: 'new password' });
  });

  it('a wrong or stale code is explained and nothing is restored', async () => {
    mocks.auth.verifyOtp.mockResolvedValue({ data: {}, error: { code: 'otp_expired', message: 'Token has expired or is invalid' } });
    const { authErrorMessage } = await import('./auth');
    await authClient.verifyCode(fields.email, '000000', 'signup').then(() => { throw new Error('verified'); }, (e) => expect(authErrorMessage(e)).toMatch(/wrong or has expired/));
    expect(mocks.table.upsert).not.toHaveBeenCalled();
  });

  it('resends through the matching channel', async () => {
    mocks.auth.resend.mockResolvedValue({ error: null });
    mocks.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    await authClient.resendCode(fields.email, 'signup');
    expect(mocks.auth.resend).toHaveBeenCalledWith({ type: 'signup', email: fields.email });
    await authClient.resendCode(fields.email, 'recovery');
    expect(mocks.auth.resetPasswordForEmail).toHaveBeenCalledWith(fields.email);
    await authClient.resetPassword(fields.email);
    expect(mocks.auth.resetPasswordForEmail).toHaveBeenCalledTimes(2);
  });
});

describe('Google', () => {
  beforeEach(() => {
    mocks.auth.signInWithOAuth.mockResolvedValue({ data: { url: 'https://accounts.google.com/o/oauth2' }, error: null });
  });

  it('opens the provider sheet with the app’s callback and signs in from the redirect', async () => {
    mocks.browser.openAuthSessionAsync.mockResolvedValue({ type: 'success', url: 'semli://auth/callback?code=abc' });
    mocks.auth.exchangeCodeForSession.mockResolvedValue({ data: { session }, error: null });
    expect(await authClient.signInWithGoogle()).toEqual({ signedIn: true, restored: false });
    expect(mocks.auth.signInWithOAuth).toHaveBeenCalledWith({ provider: 'google', options: { redirectTo: 'semli://auth/callback', skipBrowserRedirect: true } });
    expect(mocks.browser.openAuthSessionAsync).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2', 'semli://auth/callback');
    expect(mocks.auth.exchangeCodeForSession).toHaveBeenCalledWith('abc');
  });

  it('a closed sheet is not an error and signs nobody in', async () => {
    mocks.browser.openAuthSessionAsync.mockResolvedValue({ type: 'cancel' });
    expect(await authClient.signInWithGoogle()).toBeNull();
    expect(mocks.auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(mocks.table.upsert).not.toHaveBeenCalled();
  });

  it('explains a redirect that carries an error instead of a code', async () => {
    const { authErrorMessage } = await import('./auth');
    await expect(completeAuthFromUrl('semli://auth/callback?error_code=flow_state_expired&error=access_denied')).rejects.toMatchObject({ code: 'flow_state_expired' });
    expect(authErrorMessage({ code: 'flow_state_expired' })).toMatch(/took too long/);
    await expect(completeAuthFromUrl('semli://auth/callback')).rejects.toThrow(/No code/);
  });
});

describe('logging out', () => {
  it('ends the session on this phone only and keeps the plan', async () => {
    mocks.store.setState({ items: { b: item('b') }, settings: { ...DEFAULTS(), onboarded: true, cloud: { backedUpAt: '2026-10-19T00:00:00Z', error: 'x' } } });
    mocks.auth.signOut.mockResolvedValue({ error: null });
    await authClient.signOut();
    expect(mocks.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(mocks.purchases.logOut).toHaveBeenCalled();
    expect(Object.keys(mocks.store.getState().items as object)).toEqual(['b']);
    expect(settings()).toMatchObject({ onboarded: true, cloud: { backedUpAt: null, error: null } });
  });

  it('deleting the account removes the row and the user, then logs out', async () => {
    mocks.supabase.rpc.mockResolvedValue({ error: null });
    mocks.auth.signOut.mockResolvedValue({ error: null });
    await authClient.deleteAccount();
    expect(mocks.supabase.rpc).toHaveBeenCalledWith('delete_account');
    expect(mocks.auth.signOut).toHaveBeenCalled();
  });

  it('a failed deletion keeps the session', async () => {
    mocks.supabase.rpc.mockResolvedValue({ error: { code: 'x', message: 'nope' } });
    await expect(authClient.deleteAccount()).rejects.toBeTruthy();
    expect(mocks.auth.signOut).not.toHaveBeenCalled();
  });
});
