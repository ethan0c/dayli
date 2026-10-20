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
 * Off until a backend exists. The welcome is one "Get started", and You and Plan hide the account
 * and sharing previews. The screens and this adapter stay in the repo for when accounts ship.
 */
export const ACCOUNTS_ENABLED = false;

/** No backend has been configured. Never manufacture sessions, reset emails or account deletion. */
export class AuthUnavailableError extends Error {}

async function unavailable(action: string): Promise<never> {
  throw new AuthUnavailableError(`${action} isn’t available yet. You can keep using Semli as a guest.`);
}

// Replace these methods with the chosen provider adapter when backend work resumes.
// Credentials remain in component memory: no persistence, analytics or network requests.
export const authClient = {
  signIn: (_fields: AuthFields) => unavailable('Email login'),
  signUp: (_fields: AuthFields) => unavailable('Account creation'),
  signInWithGoogle: () => unavailable('Google sign-in'),
  resetPassword: (_email: string) => unavailable('Password reset'),
  deleteAccount: () => unavailable('Account deletion'),
};

export function authErrorMessage(error: unknown): string {
  return error instanceof AuthUnavailableError ? error.message : 'We couldn’t connect. Please try again.';
}
