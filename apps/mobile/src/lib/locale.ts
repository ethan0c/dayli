import { dateLocaleFrom, setDateLocale, type DateLocale, type TermSystem } from '@dayli/core';
import { getLocales, useCalendars, useLocales } from 'expo-localization';
import { useEffect, useMemo } from 'react';

import { profile } from '@/lib/analytics';
import { useStore } from '@/store';

/** Regions with their own school calendar, by the name a person would look for. */
export const REGIONS: { id: string; name: string }[] = [
  { id: 'US', name: 'United States' },
  { id: 'CA', name: 'Canada' },
  { id: 'GB', name: 'United Kingdom' },
  { id: 'IE', name: 'Ireland' },
  { id: 'AU', name: 'Australia' },
  { id: 'NZ', name: 'New Zealand' },
  { id: 'SG', name: 'Singapore' },
  { id: 'DE', name: 'Germany' },
  { id: 'AT', name: 'Austria' },
  { id: 'CH', name: 'Switzerland' },
  { id: 'NL', name: 'Netherlands' },
  { id: 'DK', name: 'Denmark' },
  { id: 'FI', name: 'Finland' },
  { id: 'NO', name: 'Norway' },
  { id: 'SE', name: 'Sweden' },
  { id: 'FR', name: 'France' },
  { id: 'JP', name: 'Japan' },
  { id: 'KR', name: 'South Korea' },
  { id: 'TW', name: 'Taiwan' },
  { id: 'HK', name: 'Hong Kong' },
];

export function regionName(id: string, locale = 'en'): string {
  const known = REGIONS.find((r) => r.id === id)?.name;
  if (known && (locale === 'en' || locale === 'pseudo-LOCALE')) return known;
  try {
    return new Intl.DisplayNames([locale === 'pseudo-LOCALE' ? 'en' : locale], { type: 'region' }).of(id) ?? known ?? id;
  } catch {
    return known ?? id;
  }
}

/** Where quarter schools are common enough to ask. */
export const hasQuarters = (region: string) => region === 'US' || region === 'CA';

type Device = { languageTag?: string | null; regionCode?: string | null; uses24hourClock?: boolean | null };

/**
 * The phone's conventions, with the region chosen in You on top. A chosen region also sets the
 * order of day and month, since that is how the person's documents are written.
 */
export function resolveDateLocale(device: Device, chosen: { region: string | null; termSystem: TermSystem }): DateLocale {
  const base = dateLocaleFrom({ locale: device.languageTag, region: device.regionCode, hour12: device.uses24hourClock == null ? null : !device.uses24hourClock });
  if (!chosen.region || chosen.region === base.region) return { ...base, termSystem: hasQuarters(base.region) ? chosen.termSystem : 'semester' };
  const language = base.locale.split('-')[0] ?? 'en';
  const regional = dateLocaleFrom({ locale: `${language}-${chosen.region}`, region: chosen.region, hour12: !base.hour12 ? false : null });
  return { ...regional, locale: base.locale, termSystem: hasQuarters(chosen.region) ? chosen.termSystem : 'semester' };
}

/** The phone's own region, before anything chosen in You. */
export function deviceRegion(): string {
  const l = getLocales()[0];
  return dateLocaleFrom({ locale: l?.languageTag, region: l?.regionCode }).region;
}

/**
 * Keeps @dayli/core's date conventions in step with the phone and with You, and records them as
 * person properties so conversion can be read per locale and region.
 */
export function useDateLocaleSync(hydrated: boolean): DateLocale {
  const [l] = useLocales();
  const [cal] = useCalendars();
  const region = useStore((s) => s.settings.region);
  const termSystem = useStore((s) => s.settings.termSystem);
  const next = useMemo(
    () => resolveDateLocale({ languageTag: l.languageTag, regionCode: l.regionCode, uses24hourClock: cal.uses24hourClock }, { region, termSystem }),
    [l.languageTag, l.regionCode, cal.uses24hourClock, region, termSystem],
  );
  setDateLocale(next);
  useEffect(() => {
    if (hydrated) profile({ locale: next.locale, region: next.region, clock: next.hour12 ? '12h' : '24h', term_system: next.termSystem });
  }, [hydrated, next]);
  return next;
}
