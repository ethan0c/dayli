import { useEffect, useRef } from 'react';
import { useNavigation, usePreventRemove } from 'expo-router';

import { PhotoPaywall } from '@/components/PhotoPaywall';
import { closePaywall } from '@/components/PlanPicker';
import { finishPaywall } from '@/lib/paywall-request';
import { usePurchases } from '@/providers/PurchasesProvider';

/** The caller's import/review remains mounted underneath this cover. */
export default function PaywallScreen() {
  const { isPlus, busy } = usePurchases();
  const navigation = useNavigation();
  const unlocked = useRef(isPlus);
  useEffect(() => { unlocked.current = isPlus; }, [isPlus]);
  usePreventRemove(busy);
  useEffect(() => {
    const unsubscribe = navigation.addListener('removed', () => finishPaywall(unlocked.current));
    // SDK 58 emits `removed` after effect cleanup; keep the listener for that microtask.
    return () => queueMicrotask(unsubscribe);
  }, [navigation]);
  return <PhotoPaywall onContinueFree={closePaywall} onComplete={closePaywall} />;
}
