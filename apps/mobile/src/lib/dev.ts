import { File, Paths } from 'expo-file-system';

/**
 * Development only: a file named `dev-step.txt` in the app's Documents folder names an
 * onboarding step to open at launch, so screens can be screenshotted without tapping through.
 * Write it with: echo demo > "$(xcrun simctl get_app_container booted app.semli.mobile data)/Documents/dev-step.txt"
 */
export async function devStep(): Promise<string | null> {
  if (!__DEV__) return null;
  try {
    const f = new File(Paths.document, 'dev-step.txt');
    if (!f.exists) return null;
    return (await f.text()).trim() || null;
  } catch {
    return null;
  }
}

/** Reads the dev file as a command: "sample", "moment", "item", "hours", "review", or "review-update". */
export async function devCommand(): Promise<string | null> {
  if (!__DEV__) return null;
  try {
    const f = new File(Paths.document, 'dev-command.txt');
    if (!f.exists) return null;
    return (await f.text()).trim() || null;
  } catch {
    return null;
  }
}

/** Development only: `dev-clock.txt` holds an HH:mm the app shows as now, so screenshots match the 9:41 status bar. */
export async function devClock(): Promise<string | null> {
  if (!__DEV__) return null;
  try {
    const f = new File(Paths.document, 'dev-clock.txt');
    if (!f.exists) return null;
    return (await f.text()).trim() || null;
  } catch {
    return null;
  }
}
