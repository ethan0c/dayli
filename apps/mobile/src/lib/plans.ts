import type { PlanId } from '@/store';

export interface Plan {
  id: PlanId;
  name: string;
  period: string;
  months: number;
  student: number;
  regular: number;
  tag?: string;
}

/** Dayli Plus prices. Student pricing is on the honor system; nothing is verified. */
export const PLANS: Plan[] = [
  { id: 'monthly', name: 'Monthly', period: 'month', months: 1, student: 4.99, regular: 7.99 },
  { id: 'semester', name: 'Semester', period: '4 months', months: 4, student: 14.99, regular: 24.99, tag: 'Most popular' },
  { id: 'yearly', name: 'Yearly', period: 'year', months: 12, student: 29.99, regular: 49.99, tag: 'Best value' },
];

export const FREE_IMPORTS_PER_MONTH = 3;

export function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function perMonth(plan: Plan, student: boolean): string {
  const price = student ? plan.student : plan.regular;
  return `$${(price / plan.months).toFixed(2)}/mo`;
}
