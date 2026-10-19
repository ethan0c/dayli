import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  refreshCustomerInfo: vi.fn(), presentPaywall: vi.fn(), track: vi.fn(),
  usage: { month: '2026-10', imports: 0 },
}));
vi.mock('./analytics', () => ({ track: mocks.track }));
vi.mock('./revenuecat', () => ({ hasSemliPro: (info: { active?: boolean }) => info.active === true }));
vi.mock('../providers/PurchasesProvider', () => ({ usePurchases: () => mocks }));
vi.mock('../store', () => ({ useStore: { getState: () => ({ usage: mocks.usage }) } }));

// All native dependencies are mocked: exercise the shared entry-point policy directly.
import { usePlusAccess as createAccess } from './plus-access';

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-19T12:00:00Z'));
  mocks.usage = { month: '2026-10', imports: 0 };
  mocks.refreshCustomerInfo.mockResolvedValue({ active: false });
  mocks.presentPaywall.mockResolvedValue(false);
});

afterEach(() => vi.useRealTimers());

describe('shared Plus access checks', () => {
  it('keeps the first three imports available without a store connection', async () => {
    for (const imports of [0, 1, 2]) {
      mocks.usage.imports = imports;
      expect(await createAccess().requireImportAccess()).toBe(true);
    }
    expect(mocks.refreshCustomerInfo).not.toHaveBeenCalled();
  });
  it('blocks an over-quota free user who dismisses the paywall', async () => {
    mocks.usage.imports = 3;
    expect(await createAccess().requireImportAccess()).toBe(false);
    expect(mocks.presentPaywall).toHaveBeenCalledOnce();
  });
  it('allows over-quota imports with an active entitlement or completed upgrade', async () => {
    mocks.usage.imports = 3;
    mocks.refreshCustomerInfo.mockResolvedValue({ active: true });
    expect(await createAccess().requireImportAccess()).toBe(true);
    expect(mocks.presentPaywall).not.toHaveBeenCalled();
    mocks.refreshCustomerInfo.mockResolvedValue({ active: false });
    mocks.presentPaywall.mockResolvedValue(true);
    expect(await createAccess().requireImportAccess()).toBe(true);
  });
  it('does not grant paid access when the store check fails', async () => {
    mocks.usage.imports = 3;
    mocks.refreshCustomerInfo.mockRejectedValue(new Error('Offline'));
    await expect(createAccess().requireImportAccess()).rejects.toThrow('Offline');
    expect(mocks.presentPaywall).not.toHaveBeenCalled();
  });
  it('gates schedule updates even when free imports remain', async () => {
    expect(await createAccess().requirePlus('schedule_update')).toBe(false);
    expect(mocks.track).toHaveBeenCalledWith('paywall_shown', { reason: 'schedule_update' });
    mocks.refreshCustomerInfo.mockResolvedValue({ active: true });
    expect(await createAccess().requirePlus('schedule_update')).toBe(true);
  });
});
