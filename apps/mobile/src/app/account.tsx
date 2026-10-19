import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { GroupLabel, ListRow, StatusPill, TextButton } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { backOrHome } from '@/components/NavButtons';
import { Button, Sheet } from '@/components/Sheet';
import { T } from '@/components/Text';
import { Wordmark } from '@/components/Wordmark';
import { useStore } from '@/store';
import { SCREEN_GUTTER, textStyle, useTheme } from '@/theme';

type Step = 'welcome' | 'email' | 'code' | 'account' | 'manage' | 'delete';

/** Frontend prototype only. It never authenticates, uploads, or changes the guest plan. */
export default function AccountScreen() {
  const { c } = useTheme();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const name = useStore((s) => s.settings.name.trim());
  const [step, setStep] = useState<Step>(section === 'manage' ? 'manage' : 'welcome');
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteFrom, setDeleteFrom] = useState<'account' | 'manage'>('manage');
  const [intent, setIntent] = useState<'create' | 'login'>('create');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.trim().length <= 254;
  const reset = () => { setStep('welcome'); setEmail(''); setCode(''); setError(null); setNotice(null); };
  const logOut = () => { reset(); setNotice('Account preview closed. You’re planning as a guest. Your schedule and Plus access are unchanged.'); };
  const next = () => {
    if (!validEmail) { setError('Enter a valid email address.'); return; }
    setError(null);
    setCode('');
    setStep('code');
  };

  return (
    <Sheet title={step === 'delete' ? 'Delete account' : step === 'manage' ? 'Account settings' : step === 'account' ? 'Account preview' : 'Account'} footer={<>
      {step === 'delete' ? <>
        <Button label="Reset account preview" onPress={() => { reset(); setNotice('Account preview reset. No account or local schedule was deleted.'); }} />
        <TextButton label="Cancel" tone="muted" onPress={() => setStep(deleteFrom)} />
      </> : step === 'welcome' ? <>
        <Button label="Continue with email" onPress={() => { setIntent('create'); setStep('email'); }} />
        <TextButton label="Keep planning as a guest" tone="muted" onPress={backOrHome} />
      </> : step === 'email' ? <>
        <Button label="Preview next step" onPress={next} />
        <TextButton label="Use Semli without an account" tone="muted" onPress={backOrHome} />
      </> : step === 'code' ? <>
        <Button label="Preview account" disabled={code.length !== 6} onPress={() => setStep('account')} />
        <TextButton label="Change email" tone="muted" onPress={() => { setStep('email'); setCode(''); }} />
      </> : <>
        <Button label="Done" variant="secondary" onPress={backOrHome} />
        <T token="caption" color={c.inkSecondary} style={styles.centerText}>These controls only reset the account preview.</T>
      </>}
    </>}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        <View style={styles.previewNote}>
          <StatusPill label="Preview" tabular={false} />
          <T token="caption" color={c.inkSecondary} style={{ flex: 1 }}>Accounts are coming soon. No account is created and nothing leaves this phone.</T>
        </View>
        {notice ? <T token="callout" color={c.inkSecondary} accessibilityRole="alert">{notice}</T> : null}

        {step === 'delete' ? <>
          <View style={styles.hero}>
            <GroupLabel>Account deletion preview</GroupLabel>
            <T token="display" accessibilityRole="header">Delete your account?</T>
            <T token="body" color={c.inkSecondary}>There’s no backend account to delete yet. For now, this only clears the email and code entered in the account preview.</T>
          </View>
          <View style={{ gap: 16 }}>
            <ListRow title="Your local plan stays" sub="Events, courses, imports and preferences won’t be removed" chevron={false} />
            <ListRow title="Your subscription stays" sub="Resetting this preview doesn’t cancel Semli Plus" chevron={false} last />
            <T token="callout" color={c.inkSecondary}>To manage information stored on this phone, go to You → Your data.</T>
          </View>
        </> : step === 'welcome' ? <>
          <View style={styles.hero}>
            <Wordmark width={100} ink={c.inkPrimary} dot={c.accent} />
            <T token="displayXl" accessibilityRole="header">Keep your week.</T>
            <T token="body" color={c.inkSecondary}>One place for your plan, even when you get a new phone. An account will be optional.</T>
          </View>
          <View>
            <ListRow leading={<Icon name="calendar" size={20} color={c.selectionInk} />} title="A home for your schedule" sub="Back up the classes, shifts and plans you’ve already added" chevron={false} />
            <ListRow leading={<Icon name="user" size={20} color={c.selectionInk} />} title="Your people, in the loop" sub="Share a read-only schedule with a friend or parent" chevron={false} />
            <ListRow leading={<Icon name="check" size={20} color={c.selectionInk} />} title="Your plan comes with you" sub="Keep your current schedule and Plus access when accounts arrive" chevron={false} last />
          </View>
          <TextButton label="Already have an account? Preview log in" onPress={() => { setIntent('login'); setStep('email'); }} style={styles.start} />
          <ListRow title="Account settings" sub="Log out and delete account previews" onPress={() => setStep('manage')} last />
        </> : step === 'email' ? <>
          <View style={styles.hero}>
            <GroupLabel>{intent === 'login' ? 'Welcome back' : 'Make room for your week'}</GroupLabel>
            <T token="display" accessibilityRole="header">{intent === 'login' ? 'Log in with email.' : 'Start with your email.'}</T>
            <T token="body" color={c.inkSecondary}>A short code will let you sign in without a password. This preview doesn’t send email.</T>
          </View>
          <View style={{ gap: 8 }}>
            <T token="callout" color={c.inkSecondary}>Email address</T>
            <TextInput accessibilityLabel="Email address" value={email} onChangeText={(value) => { setEmail(value); setError(null); }}
              placeholder="you@example.com" placeholderTextColor={c.inkTertiary} keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
              autoComplete="email" maxLength={254} returnKeyType="next" onSubmitEditing={next}
              style={[textStyle('body', c.inkPrimary), styles.field, { backgroundColor: c.row }]} />
            {error ? <T token="callout" color={c.conflict} accessibilityRole="alert">{error}</T> : null}
          </View>
          <TextButton label="Back to account options" tone="muted" onPress={reset} style={styles.start} />
        </> : step === 'code' ? <>
          <View style={styles.hero}>
            <GroupLabel>Email verification preview</GroupLabel>
            <T token="display" accessibilityRole="header">Enter your code.</T>
            <T token="body" color={c.inkSecondary}>When sign-in is available, your code will go to <T token="body">{email.trim()}</T>.</T>
          </View>
          <TextInput accessibilityLabel="Six-digit verification code preview" value={code} onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000" placeholderTextColor={c.inkTertiary} keyboardType="number-pad" maxLength={6}
            style={[textStyle('display', c.inkPrimary), styles.field, styles.code, { backgroundColor: c.row }]} />
          <T token="callout" color={c.inkSecondary}>Enter six digits to review the account layout. No code has been sent or verified.</T>
        </> : <>
          <View style={styles.hero}>
            <View style={[styles.avatar, { backgroundColor: c.selectionFill }]}><T token="title" color={c.selectionInk}>{(name || 'You').slice(0, 1).toUpperCase()}</T></View>
            <T token="display" accessibilityRole="header">{step === 'manage' ? 'Account settings' : name || 'Your account'}</T>
            <T token="body" color={c.inkSecondary}>{step === 'manage' ? 'You’re planning as a guest. Preview the account controls below.' : email.trim()}</T>
          </View>
          <View>
            <GroupLabel>Your account</GroupLabel>
            <ListRow title="Cloud backup" sub="Your schedule is still stored on this phone" trailing={<StatusPill label="Coming soon" tabular={false} />} chevron={false} />
            <ListRow title="Account status" sub={step === 'manage' ? 'No account connected' : 'This screen is a preview of a signed-in account'} trailing={<StatusPill label="Preview only" tabular={false} />} chevron={false} last />
          </View>
          <View>
            <GroupLabel>Account controls</GroupLabel>
            <ListRow title="Log out" sub="Close the account preview and return to guest options" trailing={<StatusPill label="Preview" tabular={false} />} onPress={logOut} />
            <ListRow title="Delete account" sub="Review the deletion preview" trailing={<StatusPill label="Preview" tabular={false} />} destructive onPress={() => { setDeleteFrom(step === 'account' ? 'account' : 'manage'); setStep('delete'); }} last />
          </View>
          <T token="callout" color={c.inkSecondary}>These actions don’t change your events, courses or purchases. Real sign-in, sign-out and account deletion will be connected when accounts are available.</T>
        </>}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 12, paddingBottom: 32, gap: 30 },
  previewNote: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hero: { gap: 14, paddingTop: 12 },
  field: { minHeight: 56, borderRadius: 28, paddingHorizontal: 20, paddingVertical: 14 },
  code: { textAlign: 'center', letterSpacing: 10, fontVariant: ['tabular-nums'] },
  start: { alignSelf: 'flex-start', minHeight: 44 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  centerText: { textAlign: 'center' },
});
