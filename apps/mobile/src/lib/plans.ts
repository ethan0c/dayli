// Paid plan prices, periods, and availability are configured in RevenueCat/store dashboards.

/**
 * The free allowance: five imports in the first 30 days, so a semester's syllabi load before the
 * first wall, then three a month, which one weekly work schedule uses up. Decided Oct 21, 2026
 * (docs/pricing-and-positioning.md). Counted on the phone until the server keeps a ledger.
 */
export const FREE_IMPORTS_PER_MONTH = 3;
export const FREE_IMPORTS_TO_START = 5;
export const START_WINDOW_DAYS = 30;

export type ImportUsage = {
  /** The UTC month of `imports`, "2026-10". */
  month: string;
  /** Successful imports in that month. */
  imports: number;
  /** When the first import happened; opens the start window. */
  firstImportAt?: string;
  /** Successful imports ever on this phone. */
  total?: number;
};

export function inStartWindow(usage: ImportUsage, at = new Date()): boolean {
  if (!usage.firstImportAt) return true;
  return at.getTime() - new Date(usage.firstImportAt).getTime() < START_WINDOW_DAYS * 86_400_000;
}

/** How many free imports the allowance holds right now, and how many of them are used. */
export function freeImportAllowance(usage: ImportUsage, at = new Date()): { allowed: number; used: number; toStart: boolean } {
  if (inStartWindow(usage, at)) return { allowed: FREE_IMPORTS_TO_START, used: usage.total ?? usage.imports, toStart: true };
  return { allowed: FREE_IMPORTS_PER_MONTH, used: usage.month === at.toISOString().slice(0, 7) ? usage.imports : 0, toStart: false };
}

export function freeImportsLeft(usage: ImportUsage, at = new Date()): number {
  const { allowed, used } = freeImportAllowance(usage, at);
  return Math.max(0, allowed - used);
}

export function hasFreeImports(usage: ImportUsage, at = new Date()): boolean {
  return freeImportsLeft(usage, at) > 0;
}
