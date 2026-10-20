import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AuthField } from '@/components/AuthControls';
import { Button, Sheet } from '@/components/Sheet';
import { Skeleton } from '@/components/Skeleton';
import { T } from '@/components/Text';
import { authErrorMessage, validateAuthForm } from '@/lib/auth';
import { authClient, completeAuthFromUrl, leaveAuth } from '@/lib/auth-client';
import { useStore } from '@/store';
import { SCREEN_GUTTER, useTheme } from '@/theme';

/** semli://auth/reset-password?code=… from the reset email: sign in with the link, then choose a password. */
export default function ResetPasswordScreen() {
  const { c } = useTheme();
  const params = useLocalSearchParams<{ code?: string; error_code?: string }>();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => typeof e[1] === 'string')).toString();
    completeAuthFromUrl(`semli://auth/reset-password?${query}`)
      .then(() => setReady(true))
      .catch((failure) => setLinkError(authErrorMessage(failure)));
    // The link is read once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    const invalid = validateAuthForm('signup', { email: 'a@b.co', password }).password;
    if (invalid) { setError(invalid); return; }
    setBusy(true);
    try {
      await authClient.updatePassword(password);
      useStore.getState().showToast('Password changed.');
      leaveAuth();
    } catch (failure) {
      setError(authErrorMessage(failure));
    } finally {
      setPassword('');
      setBusy(false);
    }
  };

  return (
    <Sheet title="New password" nav="push">
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          <T token="display" accessibilityRole="header">{linkError ? 'That link didn’t work.' : 'Choose a new password.'}</T>
          <T token="body" color={c.inkSecondary}>{linkError ?? 'At least 8 characters. You’ll stay logged in on this phone.'}</T>
        </View>
        {linkError ? <Button label="Send a new link" onPress={() => router.replace('/auth/forgot-password')} /> : ready ? <>
          <AuthField label="New password" password value={password} onChangeText={(v) => { setPassword(v); setError(null); }} error={error ?? undefined}
            placeholder="At least 8 characters" autoComplete="new-password" autoCapitalize="none" autoCorrect={false} maxLength={256}
            editable={!busy} returnKeyType="go" onSubmitEditing={() => void save()} />
          <Button label={busy ? 'One moment…' : 'Save password'} disabled={busy} onPress={() => void save()} />
        </> : <Skeleton height={56} round={16} />}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, paddingHorizontal: SCREEN_GUTTER, paddingTop: 28, paddingBottom: 40, gap: 28 },
  hero: { gap: 12 },
});
