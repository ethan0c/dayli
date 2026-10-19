import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Linking } from 'react-native';
import { router } from 'expo-router';
import Purchases, { type CustomerInfo, type PurchasesOffering, type PurchasesOfferings, type PurchasesPackage } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';

import { customerCenterEnabled, hasSemliPro, initializePurchases, offeringFor, purchaseErrorMessage, purchasesUnavailableReason, SubscriptionError } from '@/lib/revenuecat';
import { useStore } from '@/store';
import { requestPaywall } from '@/lib/paywall-request';

interface PurchasesContextValue {
  customerInfo: CustomerInfo | null;
  /** The offering for the user's current price list (student or regular). */
  offering: PurchasesOffering | null;
  /** All offerings, so the paywall can show the other price list for comparison. */
  offerings: PurchasesOfferings | null;
  isPro: boolean;
  loading: boolean;
  busy: boolean;
  error: string | null;
  unavailableReason: string | null;
  refresh: () => Promise<void>;
  refreshCustomerInfo: () => Promise<CustomerInfo>;
  purchase: (pack: PurchasesPackage) => Promise<CustomerInfo | null>;
  restore: () => Promise<CustomerInfo>;
  presentPaywall: () => Promise<boolean>;
  manageSubscription: () => Promise<void>;
}

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const isStudent = useStore((st) => st.settings.isStudent);
  const offering = useMemo(() => offeringFor(offerings, isStudent), [offerings, isStudent]);
  const [loading, setLoading] = useState(!purchasesUnavailableReason);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const operationInProgress = useRef(false);

  const updateCustomerInfo = useCallback((info: CustomerInfo) => {
    // A slower initial request must not overwrite a newer purchase/listener update.
    setCustomerInfo((current) => current && Date.parse(current.requestDate) > Date.parse(info.requestDate) ? current : info);
  }, []);

  const refreshCustomerInfo = useCallback(async () => {
    await initializePurchases();
    const info = await Purchases.getCustomerInfo();
    updateCustomerInfo(info);
    return info;
  }, [updateCustomerInfo]);

  const refresh = useCallback(async () => {
    if (purchasesUnavailableReason) return;
    setLoading(true);
    setError(null);
    try {
      await initializePurchases();
      const results = await Promise.allSettled([
        refreshCustomerInfo(),
        Purchases.getOfferings().then(setOfferings),
      ]);
      const failure = results.find((result) => result.status === 'rejected');
      if (failure?.status === 'rejected') setError(purchaseErrorMessage(failure.reason));
    } catch (failure) {
      setError(purchaseErrorMessage(failure));
    } finally {
      setLoading(false);
    }
  }, [refreshCustomerInfo]);

  useEffect(() => {
    if (purchasesUnavailableReason) return;
    // This SDK listener is registered in JS and can be attached before configuration.
    // Keep it attached if initial configuration fails and the user later retries.
    Purchases.addCustomerInfoUpdateListener(updateCustomerInfo);
    let disposed = false;
    // Begin the network read after the SDK's asynchronous initialization settles.
    void initializePurchases().then(() => {
      if (!disposed) void refresh();
    }).catch((failure: unknown) => {
      if (!disposed) {
        setError(purchaseErrorMessage(failure));
        setLoading(false);
      }
    });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => {
      disposed = true;
      subscription.remove();
      Purchases.removeCustomerInfoUpdateListener(updateCustomerInfo);
    };
  }, [refresh, updateCustomerInfo]);

  const run = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    if (operationInProgress.current) throw new SubscriptionError('Another plan action is still in progress.');
    operationInProgress.current = true;
    setBusy(true);
    setError(null);
    try {
      await initializePurchases();
      return await operation();
    } catch (failure) {
      setError(purchaseErrorMessage(failure));
      throw failure;
    } finally {
      operationInProgress.current = false;
      setBusy(false);
    }
  }, []);

  const purchase = useCallback((pack: PurchasesPackage) => run(async () => {
    try {
      const { customerInfo: info } = await Purchases.purchasePackage(pack);
      updateCustomerInfo(info);
      return info;
    } catch (failure) {
      if (purchaseErrorMessage(failure) === null) return null;
      throw failure;
    }
  }), [run, updateCustomerInfo]);

  const restore = useCallback(() => run(async () => {
    const info = await Purchases.restorePurchases();
    updateCustomerInfo(info);
    return info;
  }), [run, updateCustomerInfo]);

  // Presentation must not hold the purchase lock: PlanPicker owns purchase/restore actions.
  // The awaiting import/review resumes only when the paywall closes or the tour finishes.
  const presentPaywall = useCallback(() => {
    if (hasSemliPro(customerInfo)) return Promise.resolve(true);
    return requestPaywall(() => router.push('/paywall'));
  }, [customerInfo]);

  const manageSubscription = useCallback(() => run(async () => {
    if (customerCenterEnabled) {
      await RevenueCatUI.presentCustomerCenter({
        callbacks: { onRestoreCompleted: ({ customerInfo: info }) => updateCustomerInfo(info) },
      });
      await refreshCustomerInfo();
      return;
    }
    const info = await refreshCustomerInfo();
    if (!info.managementURL) throw new SubscriptionError('There is no store subscription to manage.');
    await Linking.openURL(info.managementURL);
  }), [refreshCustomerInfo, run, updateCustomerInfo]);

  const value = useMemo<PurchasesContextValue>(() => ({
    customerInfo, offering, offerings, isPro: hasSemliPro(customerInfo), loading, busy, error,
    unavailableReason: purchasesUnavailableReason,
    refresh, refreshCustomerInfo, purchase, restore, presentPaywall, manageSubscription,
  }), [customerInfo, offering, offerings, loading, busy, error, refresh, refreshCustomerInfo, purchase, restore, presentPaywall, manageSubscription]);

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}

export function usePurchases(): PurchasesContextValue {
  const value = useContext(PurchasesContext);
  if (!value) throw new Error('usePurchases must be used within PurchasesProvider.');
  return value;
}
