import { Stack } from 'expo-router';

import { navigationButtonOptions } from '@/components/NavButtons';
import { columnHeader } from '@/components/ColumnHeader';
import { useWebLayout } from '@/lib/layout';
import { mobileFonts, useTheme } from '@/theme';

export const unstable_settings = { anchor: 'index' };

export default function AuthLayout() {
  const { c } = useTheme();
  // The welcome runs the full width under its sky; the forms sit in the reading column on a wide window.
  const { sidebar } = useWebLayout();
  // Sign-in forms are narrow on a desktop: a 440 column in the middle of the window.
  const column = sidebar ? { width: '100%' as const, maxWidth: 440, alignSelf: 'center' as const } : null;
  return <Stack screenOptions={{
    headerShown: true, headerShadowVisible: false, headerTitleAlign: 'center',
    headerStyle: { backgroundColor: c.canvas }, headerTintColor: c.inkPrimary,
    headerTitleStyle: { fontFamily: mobileFonts.medium, fontSize: 16, color: c.inkPrimary },
    contentStyle: { backgroundColor: c.canvas, ...column }, ...navigationButtonOptions('back'),
    ...(sidebar ? { header: columnHeader('narrow') } : null),
  }}>
    <Stack.Screen name="index" options={{ headerShown: false, contentStyle: { backgroundColor: c.canvas } }} />
    <Stack.Screen name="login" options={{ title: 'Sign in' }} />
    <Stack.Screen name="signup" options={{ title: 'Sign up' }} />
    <Stack.Screen name="forgot-password" options={{ title: 'Forgot password' }} />
    <Stack.Screen name="reset-password" options={{ title: 'New password' }} />
    <Stack.Screen name="verify" options={{ title: 'Check your email' }} />
    <Stack.Screen name="callback" options={{ headerShown: false }} />
  </Stack>;
}
