import { Redirect, useLocalSearchParams } from 'expo-router';

/** Old links to /capture land on the Add tab, keeping their source. */
export default function CaptureRedirect() {
  const params = useLocalSearchParams<{ source?: string }>();
  return <Redirect href={{ pathname: '/add', params: params.source ? { source: params.source, at: String(Date.now()) } : {} }} />;
}
