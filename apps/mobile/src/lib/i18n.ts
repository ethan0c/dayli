import { i18n } from '@lingui/core';

import { messages as en } from '@/locales/en/messages';
import { messages as pseudo } from '@/locales/pseudo-LOCALE/messages';

/**
 * The app's language. Only English ships; a dev build with EXPO_PUBLIC_PSEUDO=1 shows the
 * pseudo-locale instead, to find hard-coded strings and text that will not fit a longer language.
 */
export const PSEUDO = __DEV__ && process.env.EXPO_PUBLIC_PSEUDO === '1';

i18n.load({ en, 'pseudo-LOCALE': pseudo });
i18n.activate(PSEUDO ? 'pseudo-LOCALE' : 'en');

export { i18n };
