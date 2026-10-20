import { useRef, useState, type ComponentRef } from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AuthField, GoogleButton } from '@/components/AuthControls';
import { TextButton } from '@/components/Controls';
import { Button, Sheet } from '@/components/Sheet';
import { T } from '@/components/Text';
import { authErrorMessage, validateAuthForm, type AuthFieldErrors, type AuthMode, type SignInResult } from '@/lib/auth';
import { authClient, leaveAuth } from '@/lib/auth-client';
import { LINKS, openLink } from '@/lib/links';
import { SCREEN_GUTTER, useTheme } from '@/theme';

const COPY = {
  login: { title: 'Log in', heading: 'Welcome back.', body: 'A little less juggling starts here.', action: 'Log in' },
  signup: { title: 'Sign up', heading: 'Make room for your week.', body: 'Create your Semli account.', action: 'Create account' },
  'forgot-password': { title: 'Forgot password', heading: 'Let’s get you back in.', body: 'Enter the email you use for Semli. We’ll send a 6-digit code to reset your password.', action: 'Send code' },
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const { c } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const copy = COPY[mode];
  const forgot = mode === 'forgot-password';
  const signup = mode === 'signup';
  const clear = (field: keyof AuthFieldErrors) => { setErrors((current) => ({ ...current, [field]: undefined })); setNotice(null); };

  async function submit(provider: 'email' | 'google' = 'email') {
    if (lock.current) return;
    if (provider === 'email') {
      const invalid = validateAuthForm(mode, { name, email, password });
      setErrors(invalid);
      if (Object.keys(invalid).length) {
        if (invalid.email) emailRef.current?.focus(); else passwordRef.current?.focus();
        return;
      }
    }
    lock.current = true;
    setBusy(true);
    setNotice(null);
    const address = email.trim();
    try {
      let result: SignInResult | null;
      if (provider === 'google') result = await authClient.signInWithGoogle();
      else if (forgot) { await authClient.resetPassword(address); result = { signedIn: false, confirmEmail: true }; }
      else if (signup) result = await authClient.signUp({ name: name.trim(), email: address, password });
      else result = await authClient.signIn({ email: address, password });
      // Stays busy: the screen is leaving, and a form that springs back for a frame looks broken.
      if (result?.signedIn) { leaveAuth(); return; }
      // On to the code screen; this form stays usable behind it. A null result is the Google sheet cancelled.
      if (result) router.push({ pathname: '/auth/verify', params: { email: address, purpose: forgot ? 'recovery' : 'signup' } });
    } catch (error) {
      setNotice(authErrorMessage(error));
    }
    setPassword('');
    setBusy(false);
    lock.current = false;
  }

  return (
    <Sheet title={copy.title} nav="push">
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          <T token="display" accessibilityRole="header">{copy.heading}</T>
          <T token="body" color={c.inkSecondary}>{copy.body}</T>
        </View>
        {!forgot ? <>
          <GoogleButton onPress={() => void submit('google')} disabled={busy} />
          <View style={styles.divider}><View style={[styles.line, { backgroundColor: c.line }]} /><T token="caption" color={c.inkTertiary}>or with email</T><View style={[styles.line, { backgroundColor: c.line }]} /></View>
        </> : null}
        <View style={{ gap: 20 }}>
          {signup ? <AuthField label="Name (optional)" value={name} onChangeText={setName} placeholder="Your name" autoComplete="name" autoCapitalize="words"
            maxLength={80} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => emailRef.current?.focus()} editable={!busy} /> : null}
          <AuthField label="Email address" inputRef={emailRef} value={email} onChangeText={(value) => { setEmail(value); clear('email'); }}
            error={errors.email} placeholder="you@example.com" keyboardType="email-address" autoComplete="email" autoCapitalize="none" autoCorrect={false}
            maxLength={254} editable={!busy} returnKeyType={forgot ? 'send' : 'next'} submitBehavior={forgot ? 'blurAndSubmit' : 'submit'}
            onSubmitEditing={() => { if (forgot) void submit(); else passwordRef.current?.focus(); }} />
          {!forgot ? <AuthField label="Password" inputRef={passwordRef} password value={password} onChangeText={(value) => { setPassword(value); clear('password'); }}
            error={errors.password} placeholder={signup ? 'At least 8 characters' : 'Your password'} autoComplete={signup ? 'new-password' : 'current-password'}
            autoCapitalize="none" autoCorrect={false} maxLength={256} editable={!busy} returnKeyType="go" onSubmitEditing={() => void submit()} /> : null}
          {mode === 'login' ? <TextButton label="Forgot password?" tone="muted" onPress={() => { setPassword(''); router.push('/auth/forgot-password'); }} style={styles.start} /> : null}
        </View>
        {notice ? <T token="callout" color={c.conflict} accessibilityRole="alert">{notice}</T> : null}
        <View style={{ gap: 12 }}>
          <Button label={busy ? 'One moment…' : copy.action} disabled={busy} onPress={() => void submit()} />
          {signup ? <T token="caption" color={c.inkSecondary} style={styles.center}>By creating an account, you agree to our <T token="caption" color={c.accentInk} accessibilityRole="link" onPress={() => void openLink(LINKS.terms)}>Terms</T> and <T token="caption" color={c.accentInk} accessibilityRole="link" onPress={() => void openLink(LINKS.privacy)}>Privacy policy</T>.</T> : null}
          <TextButton label={forgot ? 'Back to log in' : signup ? 'Already have an account? Log in' : 'New to Semli? Sign up'} tone="muted"
            onPress={() => { setPassword(''); if (forgot && router.canGoBack()) router.back(); else router.replace(signup || forgot ? '/auth/login' : '/auth/signup'); }} style={styles.footerLink} />
          <TextButton label="Continue as a guest" tone="muted" onPress={leaveAuth} style={styles.footerLink} />
        </View>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, paddingHorizontal: SCREEN_GUTTER, paddingTop: 28, paddingBottom: 40, gap: 28 },
  hero: { gap: 12, paddingBottom: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  start: { alignSelf: 'flex-start', minHeight: 44 },
  center: { textAlign: 'center' },
  footerLink: { alignSelf: 'center', minHeight: 44 },
});
