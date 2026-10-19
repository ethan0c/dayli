import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

/** Old links to /capture land on the Add tab, keeping their source. */
export default function CaptureRedirect() {
  const params = useLocalSearchParams<{ source?: string }>();
  const [at] = useState(() => String(Date.now()));
  return <Redirect href={{ pathname: '/add', params: params.source ? { source: params.source, at } : {} }} />;
}
