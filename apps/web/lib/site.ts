/**
 * Site-wide facts used by metadata, the footer, pricing, and the legal pages.
 * Prices mirror docs/pricing-and-positioning.md; change them in both places.
 */

export const SITE_URL = 'https://semli.app';
export const SITE_NAME = 'Semli';
export const SUPPORT_EMAIL = 'hello@semli.app';

/** Search terms the site is written to answer; used in metadata and the landing pages. */
export const KEYWORDS = ['student planner', 'daily planner for college students', 'syllabus to calendar', 'assignment tracker', 'work and school schedule planner', 'college schedule app', 'class schedule planner'];

export const TAGLINE = 'The daily planner for college students.';
export const DESCRIPTION =
  'Drop in a syllabus, a work schedule, or a message, and Semli tells you what matters today.';

/**
 * Semli Plus. Semester is 4 months. Student pricing is on the honor system:
 * nothing is verified; the toggle just says we trust you.
 */
export type PlanId = 'monthly' | 'semester' | 'yearly';
export interface Plan {
  id: PlanId;
  name: string;
  months: number;
  student: number;
  regular: number;
  billed: string;
  tag?: string;
}
export const PLUS_PLANS: readonly Plan[] = [
  { id: 'monthly', name: 'Monthly', months: 1, student: 4.99, regular: 7.99, billed: 'monthly' },
  { id: 'semester', name: 'Semester', months: 4, student: 14.99, regular: 24.99, billed: 'every 4 months', tag: 'Most popular' },
  { id: 'yearly', name: 'Yearly', months: 12, student: 29.99, regular: 49.99, billed: 'yearly', tag: 'Best value' },
];
export const plan = (id: PlanId) => PLUS_PLANS.find((p) => p.id === id)!;
export const money = (n: number) => `$${n.toFixed(2)}`;
export const FREE_IMPORTS_PER_MONTH = 3;
export const TRIAL_DAYS = 7;

/** Legal pages show these; bump when the text changes. */
export const LEGAL_EFFECTIVE = 'October 19, 2026';
export const LEGAL_UPDATED = 'October 19, 2026';

export function absoluteUrl(path: string) {
  return path === '/' ? SITE_URL : `${SITE_URL}${path}`;
}
