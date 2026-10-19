// Semli design tokens. Source of truth for the mobile app and the website.
// See docs/design-system.md for usage rules.

export const lavender = {
  50: '#F6F4FE',
  100: '#EEEAFD',
  200: '#DCD4FB',
  300: '#C5B8F7',
  400: '#A796F0',
  500: '#8A74E6',
  600: '#6F57D4',
  700: '#5843B0',
  800: '#43338A',
  900: '#2E2460',
} as const;

export const ink = '#222320';

// Widened copy so palettes hold plain strings rather than literal types.
const lav: Record<keyof typeof lavender, string> = lavender;

export type Category = 'school' | 'work' | 'personal';

/** Six soft tints at the same lightness, so any mix of them stays calm. */
export type TintName = 'lavender' | 'apricot' | 'mint' | 'sky' | 'butter' | 'rose';
export const TINT_NAMES: TintName[] = ['lavender', 'apricot', 'mint', 'sky', 'butter', 'rose'];
/** Tints handed to courses in order, so each course reads differently in a list. */
export const COURSE_TINTS: TintName[] = ['lavender', 'sky', 'rose', 'butter', 'mint', 'apricot'];

type Tint = { fill: string; ink: string };

const lightTint: Record<TintName, Tint> = {
  lavender: { fill: lav[200], ink: lav[800] },
  apricot: { fill: '#FBDCC8', ink: '#7A3E1A' },
  mint: { fill: '#CDEBDD', ink: '#1F5A40' },
  sky: { fill: '#D4E6FB', ink: '#1F4A80' },
  butter: { fill: '#FBEFC4', ink: '#6B4F00' },
  rose: { fill: '#FBD9E3', ink: '#7A2B48' },
};

const darkTint: Record<TintName, Tint> = {
  lavender: { fill: lav[900], ink: '#E4DDFF' },
  apricot: { fill: '#4A2C1C', ink: '#FFD9C2' },
  mint: { fill: '#1C3A2D', ink: '#CDEBDD' },
  sky: { fill: '#1B2E4A', ink: '#CFE3FF' },
  butter: { fill: '#433714', ink: '#FFE9A8' },
  rose: { fill: '#45202E', ink: '#FFD6E2' },
};

const light = {
  canvas: '#FAF9F6',
  header: '#FAF9F6',
  row: '#F0EFEB',
  surface: '#FFFFFF',
  inkPrimary: '#222320',
  inkSecondary: '#686963',
  inkTertiary: '#686963',
  onPrimary: '#FFFFFF',
  onAccent: '#FFFFFF',
  onNav: '#F4F3F8',
  controlOutline: '#82837B',
  line: '#E5E4DE',
  nav: ink,
  navInactive: '#9A99A4',
  scrim: 'rgba(24,23,28,0.40)',
  accent: '#7057BD',
  accentSoft: '#F0ECF8',
  accentBorder: '#DCD4EF',
  accentInk: '#7057BD',
  conflict: '#A2342F',
  conflictBg: '#FBEDEB',
  changed: '#80510A',
  changedBg: '#FBEFD5',
  added: '#246C43',
  addedBg: '#DDF2E6',
  chip: 'rgba(255,255,255,0.72)',
  tint: lightTint,
  category: {
    school: lightTint.lavender,
    work: lightTint.apricot,
    personal: lightTint.mint,
  } satisfies Record<Category, Tint>,
};

export type Palette = typeof light;

const dark: Palette = {
  canvas: '#151515',
  header: '#151515',
  row: '#292929',
  surface: '#202020',
  inkPrimary: '#F5F4F0',
  inkSecondary: '#B4B4AC',
  inkTertiary: '#B4B4AC',
  onPrimary: '#151515',
  onAccent: '#151515',
  onNav: '#F4F3F8',
  controlOutline: '#92938A',
  line: '#363632',
  nav: '#2A2931',
  navInactive: '#A4A3AE',
  scrim: 'rgba(0,0,0,0.55)',
  accent: '#C3AFF8',
  accentSoft: '#2B253A',
  accentBorder: '#453B5A',
  accentInk: '#C3AFF8',
  conflict: '#FFACA4',
  conflictBg: '#3B2524',
  changed: '#E2A84B',
  changedBg: '#3A2D14',
  added: '#5CC08A',
  addedBg: '#16301F',
  chip: 'rgba(255,255,255,0.12)',
  tint: darkTint,
  category: {
    school: darkTint.lavender,
    work: darkTint.apricot,
    personal: darkTint.mint,
  },
};

export const palettes = { light, dark } as const;

export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40 } as const;

export const radius = { chip: 999, row: 14, card: 16, sheet: 28, pill: 999 } as const;

/**
 * Inter 4, from the official release (apps/mobile/assets/fonts, OFL). Three optical sizes:
 * the 18pt cut for text, 24pt for titles, 28pt (the Display cut) for headings and the clock.
 * The web gets the same through Google's variable Inter, whose opsz axis picks these itself.
 */
export const fontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
} as const;

export const titleFamily = {
  regular: 'Inter-Regular',
  medium: 'InterTitle-Medium',
  semibold: 'Inter-SemiBold',
} as const;

export const displayFamily = {
  regular: 'InterDisplay-Regular',
  medium: 'InterDisplay-Medium',
  semibold: 'InterDisplay-SemiBold',
} as const;

/** Which cut a type token uses: display for 28px and up, title around 24px, text below. */
export function familyFor(token: TypeToken, weight: keyof typeof fontFamily): string {
  if (token === 'displayXl' || token === 'display') return displayFamily[weight];
  if (token === 'title') return titleFamily[weight];
  return fontFamily[weight];
}

export const typeScale = {
  displayXl: { size: 56, line: 56, weight: 'regular', tracking: -0.03 },
  display: { size: 34, line: 40, weight: 'medium', tracking: -0.02 },
  title: { size: 24, line: 30, weight: 'medium', tracking: -0.01 },
  headline: { size: 17, line: 24, weight: 'medium', tracking: 0 },
  body: { size: 17, line: 24, weight: 'regular', tracking: 0 },
  callout: { size: 15, line: 22, weight: 'regular', tracking: 0 },
  subhead: { size: 14, line: 20, weight: 'medium', tracking: 0 },
  caption: { size: 13, line: 18, weight: 'regular', tracking: 0 },
  overline: { size: 14, line: 20, weight: 'medium', tracking: 0 },
} as const satisfies Record<
  string,
  { size: number; line: number; weight: keyof typeof fontFamily; tracking: number }
>;

export type TypeToken = keyof typeof typeScale;

export * from './wordmark';
export * from './motion';
