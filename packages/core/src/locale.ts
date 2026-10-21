/**
 * How dates and times read for this person: the clock, the order of day and month, and the
 * academic calendar. The app's words stay English; only the conventions follow the device.
 * Language and region are separate on purpose (a German student in Canada). The app sets this
 * once at launch and again when the region is changed in You; the defaults are the US.
 */
export type TermSystem = 'semester' | 'quarter';

export interface DateLocale {
  /** BCP 47 tag from the device, e.g. "en-US", "de-DE", "en-GB". */
  locale: string;
  /** ISO 3166 region, e.g. "US", "GB", "DE". Drives the term calendar and numeric dates. */
  region: string;
  /** 12-hour clock with am/pm; false is "16:00". */
  hour12: boolean;
  /** "24 Oct" and 24/10, rather than "Oct 24" and 10/24. */
  dayFirst: boolean;
  /** Only the US and Canada have quarter schools in numbers worth asking about. */
  termSystem: TermSystem;
}

const US: DateLocale = { locale: 'en-US', region: 'US', hour12: true, dayFirst: false, termSystem: 'semester' };
let current: DateLocale = US;

export function dateLocale(): DateLocale {
  return current;
}

export function setDateLocale(next: Partial<DateLocale>): void {
  current = { ...current, ...next };
}

export function resetDateLocale(): void {
  current = US;
}

/** Whether a locale writes the day before the month in a numeric date (de-DE 24.10., en-GB 24/10). */
export function dayFirstFor(locale: string): boolean {
  try {
    const parts = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'numeric', timeZone: 'UTC' }).formatToParts(new Date(Date.UTC(2026, 9, 24)));
    const types = parts.map((p) => p.type);
    return types.indexOf('day') < types.indexOf('month');
  } catch {
    return false;
  }
}

/** Whether a locale uses a 12-hour clock by default, when the device does not say. */
export function hour12For(locale: string): boolean {
  try {
    return new Intl.DateTimeFormat(locale, { hour: 'numeric', timeZone: 'UTC' }).resolvedOptions().hour12 ?? true;
  } catch {
    return true;
  }
}

/** A full locale from what the device reports; anything missing is worked out from the tag. */
export function dateLocaleFrom(device: { locale?: string | null; region?: string | null; hour12?: boolean | null }): DateLocale {
  const locale = device.locale || 'en-US';
  const fromTag = locale.split('-').slice(1).find((s) => /^[A-Za-z]{2}$/.test(s));
  const region = (device.region || fromTag || 'US').toUpperCase();
  return {
    locale,
    region,
    hour12: device.hour12 ?? hour12For(locale),
    dayFirst: dayFirstFor(locale),
    termSystem: 'semester',
  };
}
