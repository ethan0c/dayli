import { Redirect } from 'expo-router';

/** Direct-link fallback: the plus opens Add directly, so this route just goes there. */
export default function AddScreen() {
  return <Redirect href="/capture" />;
}
