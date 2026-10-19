import { useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { TextButton } from '@/components/Controls';
import { Group, Row } from '@/components/Settings';
import { Button, Sheet } from '@/components/Sheet';
import { T } from '@/components/Text';
import { SCREEN_GUTTER, useTheme } from '@/theme';

/** Guest account settings. A backend session is required before account actions can run. */
export default function AccountScreen() {
  const { c } = useTheme();
  const [deleting, setDeleting] = useState(false);
  return (
    <Sheet title={deleting ? 'Delete account' : 'Account settings'} footer={deleting ? <>
      <Button label="Log in to continue" onPress={() => router.push('/auth/login')} />
      <TextButton label="Cancel" tone="muted" onPress={() => setDeleting(false)} />
    </> : undefined}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          <T token="display" accessibilityRole="header">{deleting ? 'Delete your account?' : 'Your account.'}</T>
          <T token="body" color={c.inkSecondary}>{deleting ? 'Log in to the account you want to delete. You’re currently using Semli as a guest.' : 'You’re planning as a guest. Log in or create an account whenever you’re ready.'}</T>
        </View>
        {deleting ? <>
          <T token="callout" color={c.inkSecondary}>No account or local data has been deleted. Your events, courses and Plus access are still here.</T>
          <T token="callout" color={c.inkSecondary}>To manage data stored on this phone, go to You → Your data. Account deletion and subscription cancellation are separate actions.</T>
        </> : <>
          <Group title="Get connected">
            <Row label="Log in" onPress={() => router.push('/auth/login')} />
            <Row label="Create an account" onPress={() => router.push('/auth/signup')} last />
          </Group>
          <Group title="Account controls" footer="You’re already logged out. Your schedule is stored on this phone.">
            <Row label="Log out" value="Not logged in" />
            <Row label="Delete account" destructive onPress={() => setDeleting(true)} last />
          </Group>
        </>}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 28, paddingBottom: 40, gap: 30 },
  hero: { gap: 14 },
});
