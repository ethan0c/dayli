/**
 * Site-wide facts used by metadata, the footer, pricing, and the legal pages.
 * Prices mirror docs/pricing-and-positioning.md; change them in both places.
 */

export const SITE_URL = 'https://dayli.app';
export const SITE_NAME = 'Dayli';
export const SUPPORT_EMAIL = 'hello@dayli.app';

export const TAGLINE = 'The daily planner for college students.';
export const DESCRIPTION =
  'Drop in a syllabus, a work schedule, or a message, and Dayli tells you what matters today.';

/** Dayli Plus. Semester is 4 months. */
export const PLUS_PRICE = { monthly: 4.99, semester: 14.99, yearly: 29.99 } as const;
export const FREE_IMPORTS_PER_MONTH = 3;
export const TRIAL_DAYS = 7;

/** Legal pages show these; bump when the text changes. */
export const LEGAL_EFFECTIVE = 'October 19, 2026';
export const LEGAL_UPDATED = 'October 19, 2026';

export function absoluteUrl(path: string) {
  return path === '/' ? SITE_URL : `${SITE_URL}${path}`;
}
