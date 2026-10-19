import { fontFamily } from '@dayli/tokens';
import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Settings is a native stack inside the modal: headers, back buttons, and transitions come from iOS. */
export default function SettingsLayout() {
  const { c } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: c.canvas },
        headerTintColor: c.inkPrimary,
        headerTitleStyle: { fontFamily: fontFamily.semibold, color: c.inkPrimary },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: c.canvas },
      }}>
      <Stack.Screen name="index" options={{ title: 'You' }} />
      <Stack.Screen name="appearance" options={{ title: 'Appearance' }} />
      <Stack.Screen name="plan" options={{ title: 'Your plan' }} />
      <Stack.Screen name="data" options={{ title: 'Your data' }} />
      <Stack.Screen name="server" options={{ title: 'Nowli server' }} />
    </Stack>
  );
}
