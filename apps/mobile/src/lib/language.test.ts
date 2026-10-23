import { describe, expect, it } from 'vitest';

import { resolveLanguage } from './language';

describe('app language', () => {
  it.each(['es', 'es-MX', 'es-ES', 'es-419', 'ES_ar'])('uses Spanish for %s', (locale) => {
    expect(resolveLanguage([locale])).toBe('es');
  });

  it('uses the first supported preferred language', () => {
    expect(resolveLanguage(['de-DE', 'es-MX', 'en-US'])).toBe('es');
    expect(resolveLanguage(['en-GB', 'es-MX'])).toBe('en');
  });

  it('honors a saved choice over the device language', () => {
    expect(resolveLanguage(['es-MX'], 'en')).toBe('en');
    expect(resolveLanguage(['en-US'], 'es')).toBe('es');
  });

  it('follows the device again when the saved choice is cleared', () => {
    expect(resolveLanguage(['es-MX'], null)).toBe('es');
  });

  it('falls back to English for missing or unsupported preferences', () => {
    expect(resolveLanguage([])).toBe('en');
    expect(resolveLanguage([undefined, null, '', 'ja-JP'])).toBe('en');
  });

  it('ignores an invalid saved value from an older or edited backup', () => {
    expect(resolveLanguage(['es-MX'], 'fr')).toBe('es');
  });
});
