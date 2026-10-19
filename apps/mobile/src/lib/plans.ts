// Paid plan prices, periods, and availability are configured in RevenueCat/store dashboards.
export const FREE_IMPORTS_PER_MONTH = 3;

export function hasFreeImports(usage: { month: string; imports: number }, at = new Date()): boolean {
  return usage.month !== at.toISOString().slice(0, 7) || usage.imports < FREE_IMPORTS_PER_MONTH;
}
