import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { CustomerInfo } from 'react-native-purchases';

const mocks = vi.hoisted(() => ({
  platform: { OS: 'ios' },
  constants: { executionEnvironment: 'standalone' },
  purchases: {
    setLogLevel: vi.fn().mockResolvedValue(undefined),
    isConfigured: vi.fn().mockResolvedValue(false),
    configure: vi.fn(),
  },
}));

vi.mock('react-native', () => ({ Platform: mocks.platform }));
vi.mock('expo-constants', () => ({
  default: mocks.constants,
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));
vi.mock('react-native-purchases', () => ({
  default: mocks.purchases,
  LOG_LEVEL: { DEBUG: 'DEBUG', ERROR: 'ERROR' },
  PURCHASES_ERROR_CODE: {
    PURCHASE_CANCELLED_ERROR: '1', NETWORK_ERROR: '10', OFFLINE_CONNECTION_ERROR: '35',
    PAYMENT_PENDING_ERROR: '20', PRODUCT_ALREADY_PURCHASED_ERROR: '6', PURCHASE_NOT_ALLOWED_ERROR: '3',
    RECEIPT_ALREADY_IN_USE_ERROR: '7', RECEIPT_IN_USE_BY_OTHER_SUBSCRIBER_ERROR: '13',
    CONFIGURATION_ERROR: '23', INVALID_CREDENTIALS_ERROR: '11', PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR: '5',
  },
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubGlobal('__DEV__', true);
  mocks.platform.OS = 'ios';
  mocks.constants.executionEnvironment = 'standalone';
  mocks.purchases.isConfigured.mockResolvedValue(false);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('RevenueCat initialization', () => {
  it('uses the supplied Test Store key and configures once for concurrent callers', async () => {
    const { initializePurchases } = await import('./revenuecat');
    await Promise.all([initializePurchases(), initializePurchases()]);
    expect(mocks.purchases.configure).toHaveBeenCalledExactlyOnceWith({ apiKey: 'test_uNFxutyLQIYtsoSqmHkgBRoiEOZ' });
  });

  it('keeps an existing native SDK configuration after a JS reload', async () => {
    mocks.purchases.isConfigured.mockResolvedValue(true);
    const { initializePurchases } = await import('./revenuecat');
    await initializePurchases();
    expect(mocks.purchases.configure).not.toHaveBeenCalled();
  });

  it('allows retry after initialization fails', async () => {
    mocks.purchases.isConfigured.mockRejectedValueOnce(new Error('Native failure'));
    const { initializePurchases } = await import('./revenuecat');
    await expect(initializePurchases()).rejects.toThrow('Native failure');
    await initializePurchases();
    expect(mocks.purchases.configure).toHaveBeenCalledOnce();
  });

  it.each([['ios', 'appl_test_public'], ['android', 'goog_test_public']])('uses the correct %s release key', async (platform, key) => {
    vi.stubGlobal('__DEV__', false);
    mocks.platform.OS = platform;
    vi.stubEnv('EXPO_PUBLIC_REVENUECAT_IOS_API_KEY', 'appl_test_public');
    vi.stubEnv('EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY', 'goog_test_public');
    const { initializePurchases } = await import('./revenuecat');
    await initializePurchases();
    expect(mocks.purchases.configure).toHaveBeenCalledExactlyOnceWith({ apiKey: key });
    expect(mocks.purchases.setLogLevel).toHaveBeenCalledWith('ERROR');
  });

  it.each(['', 'test_not_a_production_key'])('rejects a missing or Test Store release key: %s', async (key) => {
    vi.stubGlobal('__DEV__', false);
    vi.stubEnv('EXPO_PUBLIC_REVENUECAT_IOS_API_KEY', key);
    const { initializePurchases } = await import('./revenuecat');
    await expect(initializePurchases()).rejects.toThrow('not configured');
    expect(mocks.purchases.configure).not.toHaveBeenCalled();
  });

  it('keeps configuration diagnostics separate from the message shown on the paywall', async () => {
    const { SubscriptionError, purchaseErrorMessage } = await import('./revenuecat');
    const error = new SubscriptionError('Update Semli and try again.', 'RevenueCat public key missing');
    expect(error.message).toBe('RevenueCat public key missing');
    expect(purchaseErrorMessage(error)).toBe('Update Semli and try again.');
  });

  it.each(['web', 'expo-go'])('never unlocks real billing through %s preview mocks', async (environment) => {
    if (environment === 'web') mocks.platform.OS = 'web';
    else mocks.constants.executionEnvironment = 'storeClient';
    const { initializePurchases, purchasesUnavailableReason } = await import('./revenuecat');
    expect(purchasesUnavailableReason).toBeTruthy();
    await expect(initializePurchases()).rejects.toThrow();
    expect(mocks.purchases.configure).not.toHaveBeenCalled();
  });
});

describe('semli_plus access', () => {
  it('requires the active semli_plus entitlement, not a product ID, renewal flag, or historical purchase', async () => {
    const { hasSemliPro } = await import('./revenuecat');
    const info = (active: object, all: object = active) => ({ entitlements: { active, all }, activeSubscriptions: ['yearly'] }) as CustomerInfo;
    expect(hasSemliPro(null)).toBe(false);
    expect(hasSemliPro(info({}, { semli_plus: { isActive: false } }))).toBe(false);
    expect(hasSemliPro(info({ yearly: { isActive: true } }))).toBe(false);
    expect(hasSemliPro(info({ semli_plus: { isActive: false } }))).toBe(false);
    expect(hasSemliPro(info({ semli_plus: { isActive: true, willRenew: false } }))).toBe(true);
    expect(hasSemliPro(info({ semli_plus: { isActive: true, expirationDate: null } }))).toBe(true);
  });
});

describe('purchase errors', () => {
  it('treats user cancellation as a normal outcome', async () => {
    const { purchaseErrorMessage } = await import('./revenuecat');
    expect(purchaseErrorMessage({ code: '1' })).toBeNull();
    expect(purchaseErrorMessage({ userCancelled: true })).toBeNull();
  });

  it.each([['10', 'connection'], ['20', 'pending approval'], ['6', 'Restore purchases'], ['23', 'aren’t available']])('explains store error %s', async (code, message) => {
    const { purchaseErrorMessage } = await import('./revenuecat');
    expect(purchaseErrorMessage({ code })).toContain(message);
  });

  it('does not display private details from unknown SDK failures', async () => {
    const { purchaseErrorMessage, SubscriptionError } = await import('./revenuecat');
    expect(purchaseErrorMessage(new Error('private receipt details'))).not.toContain('private receipt');
    expect(purchaseErrorMessage(new SubscriptionError('No plans available.'))).toBe('No plans available.');
  });
});
