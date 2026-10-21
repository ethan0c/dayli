import * as SplashScreen from 'expo-splash-screen';

let hidden = false;

/** Hides the native launch splash once; later calls do nothing. */
export function hideSplash() {
  if (hidden) return;
  hidden = true;
  void SplashScreen.hideAsync().catch(() => {});
}

/** True until the splash is hidden, so the first screen knows it has a logo to take over. */
export function splashShowing() {
  return !hidden;
}
