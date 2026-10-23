/** App language is independent of the region used to interpret dates and school terms. */
export const LANGUAGES = [
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Español' },
] as const;

export type AppLanguage = (typeof LANGUAGES)[number]['id'];

/** Match all preferred languages, including regional tags such as es-MX and en-GB. */
export function resolveLanguage(preferred: readonly (string | null | undefined)[], chosen?: unknown): AppLanguage {
  if (chosen === 'en' || chosen === 'es') return chosen;
  for (const tag of preferred) {
    const language = tag?.trim().toLowerCase().split(/[-_]/)[0];
    if (language === 'en' || language === 'es') return language;
  }
  return 'en';
}
