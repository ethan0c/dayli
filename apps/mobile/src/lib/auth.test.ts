import { describe, expect, it } from 'vitest';
import { authErrorMessage, AuthUnavailableError, unavailableClient as authClient, validateAuthForm } from './auth';

describe('auth forms', () => {
  it('accepts surrounding email whitespace without changing the password', () => {
    expect(validateAuthForm('signup', { email: ' you@example.com ', password: '  pass  ' })).toEqual({});
  });
  it('catches empty and malformed email addresses in every flow', () => {
    for (const mode of ['login', 'signup', 'forgot-password'] as const) {
      for (const email of ['', 'someone', 'a@', 'a@b', 'a b@example.com', `${'a'.repeat(245)}@example.com`]) {
        expect(validateAuthForm(mode, { email, password: 'password123' }).email).toBeDefined();
      }
    }
  });
  it('requires a password for login without imposing signup rules on existing passwords', () => {
    expect(validateAuthForm('login', { email: 'a@example.com', password: '' }).password).toBeDefined();
    expect(validateAuthForm('login', { email: 'a@example.com', password: 'short' })).toEqual({});
    expect(validateAuthForm('signup', { email: 'a@example.com', password: 'short' }).password).toBeDefined();
  });
  it('only asks for email when requesting a password reset', () => {
    expect(validateAuthForm('forgot-password', { email: 'a@example.com', password: '' })).toEqual({});
  });
});

describe('unconfigured auth boundary', () => {
  it('never reports a successful login, account, reset email or deletion without a provider', async () => {
    const fields = { email: 'test@example.com', password: 'private-password' };
    for (const operation of [
      () => authClient.signIn(fields), () => authClient.signUp(fields),
      () => authClient.signInWithGoogle(), () => authClient.resetPassword(fields.email),
      () => authClient.verifyCode(fields.email, '123456', 'signup'), () => authClient.resendCode(fields.email, 'recovery'),
      () => authClient.updatePassword('new-password'),
      () => authClient.signOut(), () => authClient.deleteAccount(),
    ]) await expect(operation()).rejects.toBeInstanceOf(AuthUnavailableError);
  });
  it('does not expose credentials or raw provider errors in messages', () => {
    expect(authErrorMessage(new Error('private-password or provider detail'))).toBe('We couldn’t connect. Please try again.');
    expect(authErrorMessage(new AuthUnavailableError('Google sign-in isn’t available yet.'))).toBe('Google sign-in isn’t available yet.');
  });
  it('explains known provider codes in plain words', () => {
    expect(authErrorMessage({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toMatch(/don’t match/);
    expect(authErrorMessage({ code: 'something_new', message: 'raw detail' })).toBe('We couldn’t connect. Please try again.');
  });
  it('names the failed account action without leaking provider details', () => {
    const error = { code: '42883', message: 'function delete_account does not exist' };
    expect(authErrorMessage(error, 'account.delete')).toMatch(/couldn’t delete your account/);
    expect(authErrorMessage(error, 'account.delete')).not.toContain('delete_account');
    expect(authErrorMessage(error, 'auth.verify_code')).toMatch(/couldn’t check that code/);
  });
});
