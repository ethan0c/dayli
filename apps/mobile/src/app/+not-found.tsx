import { router } from 'expo-router';

import { RecoveryScreen } from '@/components/AppErrorBoundary';

export default function NotFoundScreen() {
  return <RecoveryScreen title="That page isn’t here." message="This link may be out of date. You can return to Semli and continue from there." actionLabel="Open Semli" onRetry={() => router.replace('/')} />;
}
