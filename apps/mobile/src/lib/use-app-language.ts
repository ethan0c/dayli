import { useLocales } from 'expo-localization';
import { useEffect, useSyncExternalStore } from 'react';

import { i18n, PSEUDO } from '@/lib/i18n';
import { resolveLanguage } from '@/lib/language';
import { useStore } from '@/store';

const subscribe = (onChange: () => void) => i18n.on('change', onChange);
const snapshot = () => i18n.locale;

/** Apply language changes outside render; also refresh the root navigator's native labels. */
export function useAppLanguage() {
  const locales = useLocales();
  const chosen = useStore((s) => s.settings.language);
  const active = useSyncExternalStore(subscribe, snapshot, snapshot);
  const next = PSEUDO ? 'pseudo-LOCALE' : resolveLanguage(locales.map((l) => l.languageTag), chosen);
  useEffect(() => {
    if (active !== next) i18n.activate(next);
  }, [active, next]);
}
