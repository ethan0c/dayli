import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { TextButton } from '@/components/Controls';
import { Skeleton } from '@/components/Skeleton';
import { T } from '@/components/Text';
import { authErrorMessage } from '@/lib/auth';
import { completeAuthFromUrl, leaveAuth } from '@/lib/auth-client';
import { SCREEN_GUTTER, useTheme } from '@/theme';

/** semli://auth/callback?code=… from a confirm-your-email link. */
export default function AuthCallbackScreen() {
  const { c } = useTheme();
  const params = useLocalSearchParams<{ code?: string; error_code?: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => typeof e[1] === 'string')).toString();
    completeAuthFromUrl(`semli://auth/callback?${query}`)
      .then(() => leaveAuth())
      .catch((failure) => setError(authErrorMessage(failure)));
    // The link is read once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.body, { backgroundColor: c.canvas }]}>
      {error ? <>
        <T token="display" accessibilityRole="header">That link didn’t work.</T>
        <T token="body" color={c.inkSecondary}>{error}</T>
        <TextButton label="Back to log in" onPress={() => router.replace('/auth/login')} style={{ alignSelf: 'flex-start', minHeight: 44 }} />
      </> : <>
        <Skeleton width={220} height={36} round={8} />
        <Skeleton width={280} height={18} round={6} />
      </>}
    </View>
  );
}

const styles = StyleSheet.create({ body: { flex: 1, paddingHorizontal: SCREEN_GUTTER, paddingTop: 120, gap: 14 } });
