import { i18n } from '@lingui/core';
import { getLocales } from 'expo-localization';

import { messages as en } from '@/locales/en/messages';
import { messages as es } from '@/locales/es/messages';
import { messages as pseudo } from '@/locales/pseudo-LOCALE/messages';
import { resolveLanguage } from '@/lib/language';

/**
 * Activate the device language before the first screen. The saved override is applied after
 * hydration by useAppLanguage. Pseudo-localization stays limited to development builds.
 */
export const PSEUDO = __DEV__ && process.env.EXPO_PUBLIC_PSEUDO === '1';

i18n.load({ en, es, 'pseudo-LOCALE': pseudo });
i18n.activate(PSEUDO ? 'pseudo-LOCALE' : resolveLanguage(getLocales().map((l) => l.languageTag)));

export { i18n };
