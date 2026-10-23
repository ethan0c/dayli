import { defineConfig } from '@lingui/cli';

/**
 * App strings. English is the source; `pseudo-LOCALE` is generated on compile and turned on in a
 * dev build with EXPO_PUBLIC_PSEUDO=1, so any text that stays plain English is hard-coded.
 * Spanish is the first translation, starting with navigation and preferences (docs/localization.md).
 */
export default defineConfig({
  sourceLocale: 'en',
  locales: ['en', 'es', 'pseudo-LOCALE'],
  pseudoLocale: { locale: 'pseudo-LOCALE' },
  fallbackLocales: { es: 'en', 'pseudo-LOCALE': 'en' },
  catalogs: [{ path: '<rootDir>/src/locales/{locale}/messages', include: ['src'] }],
});
