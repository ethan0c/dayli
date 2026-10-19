import { Stack } from 'expo-router';

import { BackButton } from '@/components/NavButtons';

import { mobileFonts, useTheme } from '@/theme';

/** Deep links like /settings/data get the You screen underneath, so the back button always works. */
export const unstable_settings = { anchor: 'index' };

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
        headerTitleStyle: { fontFamily: mobileFonts.semibold, color: c.inkPrimary, fontSize: 17 },
        headerTitleAlign: 'center',
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: c.canvas },
      }}>
      <Stack.Screen name="index" options={{ title: 'You', headerLeft: () => <BackButton /> }} />
      <Stack.Screen name="reminders" options={{ title: 'Reminders' }} />
      <Stack.Screen name="appearance" options={{ title: 'Appearance' }} />
      <Stack.Screen name="major" options={{ title: 'Field of study' }} />
      <Stack.Screen name="plan" options={{ title: 'Semli Plus' }} />
      <Stack.Screen name="data" options={{ title: 'Your data' }} />
      <Stack.Screen name="server" options={{ title: 'Semli server' }} />
    </Stack>
  );
}
