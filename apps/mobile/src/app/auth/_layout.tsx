import { Stack } from 'expo-router';

import { navigationButtonOptions } from '@/components/NavButtons';
import { mobileFonts, useTheme } from '@/theme';

export const unstable_settings = { anchor: 'index' };

export default function AuthLayout() {
  const { c } = useTheme();
  return <Stack screenOptions={{
    headerShown: true, headerShadowVisible: false, headerTitleAlign: 'center',
    headerStyle: { backgroundColor: c.canvas }, headerTintColor: c.inkPrimary,
    headerTitleStyle: { fontFamily: mobileFonts.medium, fontSize: 16, color: c.inkPrimary },
    contentStyle: { backgroundColor: c.canvas }, ...navigationButtonOptions('back'),
  }}>
    <Stack.Screen name="index" options={{ headerShown: false }} />
    <Stack.Screen name="login" options={{ title: 'Sign in' }} />
    <Stack.Screen name="signup" options={{ title: 'Sign up' }} />
    <Stack.Screen name="forgot-password" options={{ title: 'Forgot password' }} />
    <Stack.Screen name="reset-password" options={{ title: 'New password' }} />
    <Stack.Screen name="verify" options={{ title: 'Check your email' }} />
  </Stack>;
}
