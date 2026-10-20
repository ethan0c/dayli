export type AuthMode = 'login' | 'signup' | 'forgot-password';
export type AuthFields = { name?: string; email: string; password: string };
export type AuthFieldErrors = Partial<Record<keyof AuthFields, string>>;

/** Form checks only. The eventual identity provider remains responsible for authentication. */
export function validateAuthForm(mode: AuthMode, fields: AuthFields): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const email = fields.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) errors.email = 'Enter a valid email address.';
  if (mode !== 'forgot-password' && !fields.password) errors.password = 'Enter your password.';
  else if (mode === 'signup' && fields.password.length < 8) errors.password = 'Use at least 8 characters.';
  return errors;
}

/**
 * Accounts are on once the Supabase project keys are set (see docs/supabase.md); without them the
 * welcome is one "Get started" and You shows no account rows. Guests never need an account.
 */
export const ACCOUNTS_ENABLED = !!(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_KEY);
/** Live share links need their own backend work; the preview stays hidden until then. */
export const SHARING_ENABLED = false;

/** No provider is configured. Never manufacture sessions, reset emails or account deletion. */
export class AuthUnavailableError extends Error {}

async function unavailable(action: string): Promise<never> {
  throw new AuthUnavailableError(`${action} isn’t available yet. You can keep using Semli as a guest.`);
}

/** Email codes, not links: they work when the email is opened on another device. */
export type CodePurpose = 'signup' | 'recovery';

export type SignInResult = { signedIn: true; restored: boolean } | { signedIn: false; confirmEmail: true };

export interface AuthClient {
  signIn: (fields: AuthFields) => Promise<SignInResult>;
  signUp: (fields: AuthFields) => Promise<SignInResult>;
  signInWithGoogle: () => Promise<SignInResult | null>;
  /** Sends a 6-digit code; verifyCode with 'recovery' signs in so updatePassword can run. */
  resetPassword: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string, purpose: CodePurpose) => Promise<SignInResult>;
  resendCode: (email: string, purpose: CodePurpose) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

// Credentials remain in component memory: no persistence, analytics or network requests.
export const unavailableClient: AuthClient = {
  signIn: () => unavailable('Email login'),
  signUp: () => unavailable('Account creation'),
  signInWithGoogle: () => unavailable('Google sign-in'),
  resetPassword: () => unavailable('Password reset'),
  verifyCode: () => unavailable('Email codes'),
  resendCode: () => unavailable('Email codes'),
  updatePassword: () => unavailable('Password reset'),
  signOut: () => unavailable('Log out'),
  deleteAccount: () => unavailable('Account deletion'),
};

/** Supabase error codes we can explain; anything else is a plain retry. Never echo provider text. */
const MESSAGES: Record<string, string> = {
  invalid_credentials: 'That email and password don’t match. Try again or reset your password.',
  user_already_exists: 'There’s already an account with that email. Log in instead.',
  email_exists: 'There’s already an account with that email. Log in instead.',
  email_not_confirmed: 'Confirm your email first. We sent you a new code.',
  weak_password: 'Choose a longer password, at least 8 characters.',
  same_password: 'Choose a password you haven’t used here before.',
  over_email_send_rate_limit: 'Too many emails in a row. Wait a minute and try again.',
  over_request_rate_limit: 'Too many tries in a row. Wait a minute and try again.',
  otp_expired: 'That code is wrong or has expired. Check the latest email, or send a new code.',
  flow_state_expired: 'That sign-in took too long. Please try again.',
};

export function authErrorMessage(error: unknown): string {
  if (error instanceof AuthUnavailableError) return error.message;
  const code = typeof error === 'object' && error !== null ? (error as { code?: unknown }).code : undefined;
  return (typeof code === 'string' && MESSAGES[code]) || 'We couldn’t connect. Please try again.';
}
