import { diffDays, formatTime, localParts, monthDay, relativeDay } from '@dayli/core';
import { useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { TextButton } from '@/components/Controls';
import { Group, Row } from '@/components/Settings';
import { Button, Sheet } from '@/components/Sheet';
import { T } from '@/components/Text';
import { authErrorMessage } from '@/lib/auth';
import { authClient } from '@/lib/auth-client';
import { feedback } from '@/lib/feedback';
import { useNow } from '@/lib/now';
import { useSession } from '@/lib/supabase';
import { useStore } from '@/store';
import { SCREEN_GUTTER, useTheme } from '@/theme';

/** Account settings. Signing out or deleting the account never touches the plan on this phone. */
export default function AccountScreen() {
  const { c } = useTheme();
  const now = useNow();
  const session = useSession((s) => s.session);
  const cloud = useStore((s) => s.settings.cloud);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = session?.user;

  const run = async (action: () => Promise<void>, done: string, operation: string) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      feedback('success');
      useStore.getState().showToast(done);
      router.dismissTo('/');
    } catch (failure) {
      setError(authErrorMessage(failure, operation));
    } finally {
      setBusy(false);
    }
  };

  const backedUp = (() => {
    if (cloud.error) return cloud.error;
    if (!cloud.backedUpAt) return 'Backing up…';
    const at = localParts(new Date(cloud.backedUpAt));
    const day = Math.abs(diffDays(at.date, now.date)) <= 1 ? relativeDay(now.date, at.date) : monthDay(at.date);
    return `Backed up ${day.toLowerCase()}, ${formatTime(at.time)}`;
  })();

  if (!user) {
    return (
      <Sheet title="Account settings">
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.hero}>
            <T token="display" accessibilityRole="header">Your account.</T>
            <T token="body" color={c.inkSecondary}>You’re planning as a guest. Log in to back up your plan and bring it to a new phone.</T>
          </View>
          <Group title="Get connected" footer="Your schedule is stored on this phone until you log in.">
            <Row label="Log in" onPress={() => router.push('/auth/login')} />
            <Row label="Create an account" onPress={() => router.push('/auth/signup')} last />
          </Group>
        </ScrollView>
      </Sheet>
    );
  }

  return (
    <Sheet title={deleting ? 'Delete account' : 'Account settings'} footer={deleting ? <>
      <Button label={busy ? 'Deleting…' : 'Delete my account'} disabled={busy} onPress={() => void run(authClient.deleteAccount, 'Account deleted. Your plan is still on this phone.', 'account.delete')} />
      <TextButton label="Keep my account" tone="muted" onPress={() => setDeleting(false)} />
    </> : undefined}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          <T token="display" accessibilityRole="header">{deleting ? 'Delete your account?' : 'Your account.'}</T>
          <T token="body" color={c.inkSecondary}>{deleting
            ? 'This removes your account and its backup for good. Your plan stays on this phone, and Semli Plus is billed by Apple: cancel it in Manage subscription.'
            : user.email ?? 'Signed in with Google'}</T>
        </View>
        {error ? <T token="callout" color={c.conflict} accessibilityRole="alert">{error}</T> : null}
        {!deleting ? <>
          <Group title="Backup" footer="Your plan is saved to your account a few seconds after each change. Log in on a new phone to bring it back.">
            <Row label="Status" value={backedUp} />
          </Group>
          <Group title="Account controls" footer="Logging out keeps everything on this phone.">
            <Row label={busy ? 'Logging out…' : 'Log out'} onPress={busy ? undefined : () => void run(authClient.signOut, 'Logged out. Your plan is still on this phone.', 'account.log_out')} />
            <Row label="Delete account" destructive onPress={() => setDeleting(true)} last />
          </Group>
        </> : null}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 28, paddingBottom: 40, gap: 30 },
  hero: { gap: 14 },
});
