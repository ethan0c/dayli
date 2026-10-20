import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TextButton } from '@/components/Controls';
import { T } from '@/components/Text';
import { retryPlannerSave, useStorageStatus } from '@/lib/storage';
import { reportError } from '@/lib/errors';
import { useTheme } from '@/theme';

export function StorageWarning() {
  const failed = useStorageStatus((s) => s.saveFailed);
  const [busy, setBusy] = useState(false);
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  if (!failed) return null;
  return <View style={{ paddingHorizontal: 24, paddingTop: insets.top + 12, paddingBottom: 12, gap: 4, backgroundColor: c.changedBg }}>
    <T token="callout" accessibilityRole="alert">Your changes couldn’t be saved on this phone. Keep Semli open and try again. If storage is full, free up space first.</T>
    <TextButton label={busy ? 'Saving…' : 'Try saving again'} onPress={() => {
      if (busy) return;
      setBusy(true);
      void retryPlannerSave().catch((error: unknown) => reportError('storage.retry_save', error)).finally(() => setBusy(false));
    }} />
  </View>;
}
