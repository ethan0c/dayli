import { readFileSync } from 'node:fs';
import { setupI18n } from '@lingui/core';
import { describe, expect, it } from 'vitest';

import { messages as en } from '../locales/en/messages';
import { messages as es } from '../locales/es/messages';
import { messages as pseudo } from '../locales/pseudo-LOCALE/messages';

/** Read source translations too: compiled catalogs can hide missing entries with English fallbacks. */
function translations(locale: string): Map<string, string> {
  const po = readFileSync(new URL(`../locales/${locale}/messages.po`, import.meta.url), 'utf8');
  const messages = new Map<string, string>();
  for (const block of po.split(/\n\s*\n/)) {
    const parts = { msgid: '', msgstr: '' };
    let field: keyof typeof parts | null = null;
    for (const line of block.split('\n')) {
      const match = /^(msgid|msgstr) (".*")$/.exec(line);
      if (match) {
        field = match[1] as keyof typeof parts;
        parts[field] = JSON.parse(match[2]);
      } else if (field && line.startsWith('"')) {
        parts[field] += JSON.parse(line);
      }
    }
    if (parts.msgid) messages.set(parts.msgid, parts.msgstr);
  }
  return messages;
}

describe('localization catalogs', () => {
  it('has a Spanish translation for every extracted message, without relying on fallbacks', () => {
    const source = translations('en');
    const spanish = translations('es');
    expect(source.size).toBeGreaterThan(0);
    expect([...spanish.keys()].sort()).toEqual([...source.keys()].sort());
    for (const [id, message] of spanish) {
      expect(message.trim(), `Missing Spanish translation: ${id}`).not.toBe('');
      const placeholders = (text: string) => [...new Set([...text.matchAll(/\{(\w+)(?:,|\})/g)].map((m) => m[1]))].sort();
      expect(placeholders(message), `Changed placeholders: ${id}`).toEqual(placeholders(source.get(id)!));
    }
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
  });

  it.each([
    { locale: 'en', trialEnds: 1, expected: 'Plus · Trial, 1 day left' },
    { locale: 'en', trialEnds: 3, expected: 'Plus · Trial, 3 days left' },
    { locale: 'es', trialEnds: 1, expected: 'Plus · Prueba, queda 1 día' },
    { locale: 'es', trialEnds: 3, expected: 'Plus · Prueba, quedan 3 días' },
  ])('formats trial days in $locale with count $trialEnds', ({ locale, trialEnds, expected }) => {
    const messages = locale === 'en' ? en : es;
    const i18n = setupI18n({ locale, messages: { [locale]: messages } });
    expect(i18n._('settings.trial_remaining', { trialEnds })).toBe(expected);
  });

  it('formats import counts and preserves inserted values in Spanish', () => {
    const i18n = setupI18n({ locale: 'es', messages: { es } });
    expect(i18n._('settings.monthly_imports', { allowed: 1, used: 0 })).toBe('Gratis · 0 de 1 importación');
    expect(i18n._('settings.initial_imports', { allowed: 3, used: 2 })).toBe('Gratis · 2 de 3 importaciones iniciales');
  });

  it('switches an existing translator between English and Spanish', () => {
    const i18n = setupI18n({ locale: 'en', messages: { en, es } });
    expect(i18n._('settings.trial_remaining', { trialEnds: 1 })).toContain('1 day');
    i18n.activate('es');
    expect(i18n._('settings.trial_remaining', { trialEnds: 1 })).toContain('1 día');
    i18n.activate('en');
    expect(i18n._('settings.trial_remaining', { trialEnds: 1 })).toContain('1 day');
  });

  it('keeps pseudo-localization available without changing interpolation data', () => {
    const i18n = setupI18n({ locale: 'pseudo-LOCALE', messages: { 'pseudo-LOCALE': pseudo } });
    const message = i18n._('settings.monthly_imports', { allowed: 3, used: 2 });
    expect(message).toContain('2');
    expect(message).toContain('3');
    expect(message).not.toBe('Free · 2 of 3 imports');
  });
});
