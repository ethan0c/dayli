import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PURCHASES_ERROR_CODE, type CustomerInfo, type PurchasesOffering, type PurchasesOfferings } from 'react-native-purchases';
import { reportError } from './errors';

export const PRO_ENTITLEMENT = 'semli_pro';

/** Offerings are two price lists for the same plans; see docs/revenuecat-offerings-brief.md. */
export const STUDENT_OFFERING = 'student';
export const REGULAR_OFFERING = 'regular';

export function offeringFor(offerings: PurchasesOfferings | null, student: boolean): PurchasesOffering | null {
  if (!offerings) return null;
  const wanted = offerings.all[student ? STUDENT_OFFERING : REGULAR_OFFERING];
  return wanted ?? offerings.current ?? null;
}
// Public SDK key for Semli's RevenueCat Test Store, not a secret API key.
const TEST_API_KEY = 'test_uNFxutyLQIYtsoSqmHkgBRoiEOZ';

export const purchasesUnavailableReason = Platform.OS !== 'ios' && Platform.OS !== 'android'
  ? 'Subscriptions are available in the Semli mobile app.'
  : Constants.executionEnvironment === ExecutionEnvironment.StoreClient
    ? 'Open a Semli development build to purchase or restore a plan.'
    : null;

export const usingTestStore = __DEV__;
export const customerCenterEnabled = process.env.EXPO_PUBLIC_REVENUECAT_CUSTOMER_CENTER_ENABLED === 'true';

let initialization: Promise<void> | null = null;

/** One configuration per JS runtime, including React Strict Mode's effect replay. */
export function initializePurchases(): Promise<void> {
  if (purchasesUnavailableReason) return Promise.reject(new SubscriptionError(purchasesUnavailableReason));
  if (!initialization) {
    initialization = (async () => {
      const apiKey = usingTestStore
        ? TEST_API_KEY
        : Platform.OS === 'ios'
          ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
          : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
      if (!apiKey || (!usingTestStore && apiKey.startsWith('test_'))) {
        throw new SubscriptionError('Subscriptions are not configured for this build. Please try a newer version of Semli.');
      }
      await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
      if (!(await Purchases.isConfigured())) Purchases.configure({ apiKey });
    })().catch((error: unknown) => {
      initialization = null;
      throw error;
    });
  }
  return initialization;
}

export function hasSemliPro(info: CustomerInfo | null): boolean {
  return info?.entitlements.active[PRO_ENTITLEMENT]?.isActive === true;
}

/** Cancellation is expected; only actionable failures need a message. */
export function purchaseErrorMessage(error: unknown, operation = 'purchases'): string | null {
  const cancelled = error as { code?: unknown; userCancelled?: unknown } | null;
  if (cancelled?.userCancelled === true || cancelled?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return null;
  reportError(operation, error);
  if (typeof error === 'object' && error !== null) {
    const failure = error as { code?: string; userCancelled?: boolean };
    if (failure.userCancelled || failure.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return null;
    switch (failure.code) {
      case PURCHASES_ERROR_CODE.NETWORK_ERROR:
      case PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR:
        return 'We couldn’t reach the store. Check your connection and try again.';
      case PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR:
        return 'Your payment is pending approval. Semli Plus will unlock when the store confirms it.';
      case PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR:
        return 'You already own this plan. Choose Restore purchases to recover access.';
      case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
        return 'Purchases aren’t allowed on this device. Check your store account and device restrictions.';
      case PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR:
      case PURCHASES_ERROR_CODE.RECEIPT_IN_USE_BY_OTHER_SUBSCRIBER_ERROR:
        return 'This purchase belongs to another account. Use the original account or contact support.';
      case PURCHASES_ERROR_CODE.CONFIGURATION_ERROR:
      case PURCHASES_ERROR_CODE.INVALID_CREDENTIALS_ERROR:
      case PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR:
        return 'Plans aren’t available right now. Please try again later.';
    }
  }
  return error instanceof SubscriptionError ? error.message : 'We couldn’t update your plan. Please try again.';
}

export class SubscriptionError extends Error {}
