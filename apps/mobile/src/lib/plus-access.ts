import { track } from './analytics';
import { hasFreeImports } from './plans';
import { hasSemliPro } from './revenuecat';
import { usePurchases } from '../providers/PurchasesProvider';
import { useStore } from '../store';

/** Every paid entry point checks the store entitlement; trial preferences grant no access. */
export function usePlusAccess() {
  const { refreshCustomerInfo, presentPaywall } = usePurchases();

  async function requirePlus(reason: 'quota' | 'schedule_update' | 'canvas') {
    const info = await refreshCustomerInfo();
    if (hasSemliPro(info)) return true;
    track('paywall_shown', { reason });
    return presentPaywall();
  }

  async function requireImportAccess() {
    if (hasFreeImports(useStore.getState().usage)) return true;
    return requirePlus('quota');
  }

  return { requirePlus, requireImportAccess };
}
