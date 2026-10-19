import { Stack } from 'expo-router';

import { navigationButtonOptions } from '@/components/NavButtons';

import { palettes } from '@dayli/tokens';
import { mobileFonts, useTheme } from '@/theme';

/** Deep links like /settings/data get the You screen underneath, so the back button always works. */
export const unstable_settings = { anchor: 'index' };

/** Settings pushes from You. Every route needs Back, including the first nested route. */
export default function SettingsLayout() {
  const { c } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: c.canvas },
        headerTintColor: c.inkPrimary,
        headerTitleStyle: { fontFamily: mobileFonts.medium, color: c.inkPrimary, fontSize: 16 },
        headerTitleAlign: 'center',
        headerBackButtonDisplayMode: 'minimal',
        ...navigationButtonOptions('back'),
        contentStyle: { backgroundColor: c.canvas },
      }}>
      <Stack.Screen name="index" options={{ title: 'You' }} />
      <Stack.Screen name="name" options={{ title: 'Name' }} />
      <Stack.Screen name="reminders" options={{ title: 'Reminders' }} />
      <Stack.Screen name="appearance" options={{ title: 'Appearance' }} />
      <Stack.Screen name="major" options={{ title: 'Field of study' }} />
      <Stack.Screen name="plan" options={{ title: 'Semli Plus', headerTransparent: true, headerTintColor: palettes.dark.inkPrimary, headerTitleStyle: { fontFamily: mobileFonts.medium, color: palettes.dark.inkPrimary, fontSize: 16 } }} />
      <Stack.Screen name="data" options={{ title: 'Your data' }} />
      <Stack.Screen name="server" options={{ title: 'Semli server' }} />
    </Stack>
  );
}
