import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Linking } from 'react-native';
import { router } from 'expo-router';
import Purchases, { type CustomerInfo, type PurchasesOffering, type PurchasesOfferings, type PurchasesPackage } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';

import { customerCenterEnabled, hasSemliPro, initializePurchases, offeringFor, purchaseErrorMessage, purchasesUnavailableReason, SubscriptionError } from '@/lib/revenuecat';
import { getPlusStatus, setPlusStatus } from '@/lib/plus-status';
import { accountOf, useSession } from '@/lib/supabase';
import { useStore } from '@/store';
import { requestPaywall } from '@/lib/paywall-request';
import { withErrorLogging } from '@/lib/errors';

interface PurchasesContextValue {
  customerInfo: CustomerInfo | null;
  /** The offering for the user's current price list (student or regular). */
  offering: PurchasesOffering | null;
  /** All offerings, so the paywall can show the other price list for comparison. */
  offerings: PurchasesOfferings | null;
  isPlus: boolean;
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
  // Guests keep RevenueCat's own anonymous id, so a purchase made as a guest carries over on sign-up.
  const userId = useSession((st) => accountOf(st.session)?.user.id);

  // Code outside React (alarm sync) reads Plus from here. Without a store answer, Plus is off.
  useEffect(() => {
    if (customerInfo) setPlusStatus(hasSemliPro(customerInfo) ? 'active' : 'inactive');
    else if (purchasesUnavailableReason) setPlusStatus('inactive');
  }, [customerInfo]);

  const updateCustomerInfo = useCallback((info: CustomerInfo) => {
    // A slower initial request must not overwrite a newer purchase/listener update.
    setCustomerInfo((current) => current && Date.parse(current.requestDate) > Date.parse(info.requestDate) ? current : info);
  }, []);

  // Plus follows the account: a signed-in person's purchases are keyed to their Supabase id,
  // so they come back on a new phone. Sign out happens in authClient.signOut.
  useEffect(() => {
    if (purchasesUnavailableReason || !userId) return;
    void initializePurchases()
      .then(() => Purchases.logIn(userId))
      .then(({ customerInfo: info }) => updateCustomerInfo(info))
      .catch((failure: unknown) => setError(purchaseErrorMessage(failure, 'purchases.link_account')));
  }, [userId, updateCustomerInfo]);

  const refreshCustomerInfo = useCallback(async () => {
    await initializePurchases();
    const info = await withErrorLogging('purchases.customer_info', () => Purchases.getCustomerInfo());
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
      results.forEach((result, index) => {
        if (result.status === 'rejected') setError(purchaseErrorMessage(result.reason, index === 0 ? 'purchases.customer_info' : 'purchases.offerings'));
      });
    } catch (failure) {
      setError(purchaseErrorMessage(failure, 'purchases.refresh'));
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
        setError(purchaseErrorMessage(failure, 'purchases.initialize'));
        setLoading(false);
        if (getPlusStatus() === 'unknown') setPlusStatus('inactive');
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

  const run = useCallback(async <T,>(name: string, operation: () => Promise<T>): Promise<T> => {
    if (operationInProgress.current) throw new SubscriptionError('Another plan action is still in progress.');
    operationInProgress.current = true;
    setBusy(true);
    setError(null);
    try {
      await initializePurchases();
      return await operation();
    } catch (failure) {
      setError(purchaseErrorMessage(failure, name));
      throw failure;
    } finally {
      operationInProgress.current = false;
      setBusy(false);
    }
  }, []);

  const purchase = useCallback((pack: PurchasesPackage) => run('purchases.purchase', async () => {
    try {
      const { customerInfo: info } = await Purchases.purchasePackage(pack);
      updateCustomerInfo(info);
      return info;
    } catch (failure) {
      if (purchaseErrorMessage(failure, 'purchases.purchase') === null) return null;
      throw failure;
    }
  }), [run, updateCustomerInfo]);

  const restore = useCallback(() => run('purchases.restore', async () => {
    const info = await Purchases.restorePurchases();
    updateCustomerInfo(info);
    return info;
  }), [run, updateCustomerInfo]);

  // Presentation must not hold the purchase lock: PlanPicker owns purchase/restore actions.
  // The awaiting import/review resumes only when the paywall closes or the tour finishes.
  const presentPaywall = useCallback(() => {
    // The gate already fetched fresh access. Do not short-circuit with the render's
    // captured CustomerInfo, which can still predate that refresh (e.g. expiration).
    return requestPaywall(() => router.push('/paywall'));
  }, []);

  const manageSubscription = useCallback(() => run('purchases.manage', async () => {
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
    customerInfo, offering, offerings, isPlus: hasSemliPro(customerInfo), loading, busy, error,
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
