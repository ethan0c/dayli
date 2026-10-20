import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AuthField } from '@/components/AuthControls';
import { TextButton } from '@/components/Controls';
import { Button, Sheet } from '@/components/Sheet';
import { T } from '@/components/Text';
import { authErrorMessage, type CodePurpose } from '@/lib/auth';
import { authClient, leaveAuth } from '@/lib/auth-client';
import { SCREEN_GUTTER, useTheme } from '@/theme';

const CODE_LENGTH = 6;
/** Supabase allows one email a minute per address. */
const RESEND_AFTER_S = 60;

/** The 6-digit code from a sign-up or reset email. Sign-up lands in the planner; reset goes on to a new password. */
export default function VerifyScreen() {
  const { c } = useTheme();
  const params = useLocalSearchParams<{ email?: string; purpose?: string }>();
  const email = params.email ?? '';
  const purpose: CodePurpose = params.purpose === 'recovery' ? 'recovery' : 'signup';
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(RESEND_AFTER_S);
  const lock = useRef(false);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const verify = async (value = code) => {
    if (lock.current || value.length < CODE_LENGTH) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      await authClient.verifyCode(email, value, purpose);
      if (purpose === 'recovery') router.replace('/auth/reset-password');
      else leaveAuth();
    } catch (failure) {
      setError(authErrorMessage(failure));
      setCode('');
    } finally {
      setBusy(false);
      lock.current = false;
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await authClient.resendCode(email, purpose);
      setWait(RESEND_AFTER_S);
    } catch (failure) {
      setError(authErrorMessage(failure));
    }
  };

  return (
    <Sheet title={purpose === 'recovery' ? 'Reset password' : 'Confirm email'} nav="push">
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          <T token="display" accessibilityRole="header">Check your email.</T>
          <T token="body" color={c.inkSecondary}>{`We sent a ${CODE_LENGTH}-digit code to ${email}. It works for an hour.`}</T>
        </View>
        <AuthField label="Code" value={code} error={error ?? undefined} placeholder="123456" autoFocus
          keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={CODE_LENGTH} editable={!busy}
          onChangeText={(v) => {
            const digits = v.replace(/\D/g, '');
            setCode(digits);
            setError(null);
            if (digits.length === CODE_LENGTH) void verify(digits);
          }} />
        <View style={{ gap: 12 }}>
          <Button label={busy ? 'Checking…' : 'Continue'} disabled={busy || code.length < CODE_LENGTH} onPress={() => void verify()} />
          {wait > 0
            ? <T token="caption" color={c.inkSecondary} style={styles.center}>{`Send a new code in ${wait}s`}</T>
            : <TextButton label="Send a new code" tone="muted" onPress={() => void resend()} style={styles.link} />}
          <TextButton label="Use a different email" tone="muted" onPress={() => router.back()} style={styles.link} />
        </View>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, paddingHorizontal: SCREEN_GUTTER, paddingTop: 28, paddingBottom: 40, gap: 28 },
  hero: { gap: 12 },
  center: { textAlign: 'center', minHeight: 44, textAlignVertical: 'center' },
  link: { alignSelf: 'center', minHeight: 44 },
});
