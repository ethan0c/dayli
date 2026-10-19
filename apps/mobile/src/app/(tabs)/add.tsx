import { localParts } from '@dayli/core';
import { router } from 'expo-router';
import { View } from 'react-native';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/Sheet';
import { SCREEN_GUTTER, useTheme } from '@/theme';

/** Direct-link fallback. Native taps are intercepted and keep the active tab. */
export default function AddScreen() {
  const { c } = useTheme();
  return <View style={{ flex: 1, backgroundColor: c.canvas }}>
    <ScreenHeader title="Add" safeTop />
    <View style={{ padding: SCREEN_GUTTER, gap: 12 }}>
      <Button label="Tell Semli" onPress={() => router.push('/capture')} />
      <Button label="To-do" variant="ghost" onPress={() => router.push({ pathname: '/create', params: { kind: 'task', date: localParts(new Date()).date } })} />
      <Button label="Event" variant="ghost" onPress={() => router.push({ pathname: '/create', params: { kind: 'event', date: localParts(new Date()).date } })} />
    </View>
  </View>;
}
