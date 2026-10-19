// Dayli design tokens. Source of truth for the mobile app and the website.
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

export const ink = '#1C1B21';

// Widened copy so palettes hold plain strings rather than literal types.
const lav: Record<keyof typeof lavender, string> = lavender;

export type Category = 'school' | 'work' | 'personal';

const light = {
  canvas: '#FFFFFF',
  header: '#F1F0F4',
  row: '#F2F2F5',
  surface: '#FFFFFF',
  inkPrimary: '#18171C',
  inkSecondary: '#6B6A75',
  inkTertiary: '#A09FA8',
  line: '#E4E3EA',
  nav: ink,
  navInactive: '#8C8B96',
  scrim: 'rgba(24,23,28,0.40)',
  accent: lav[600],
  accentSoft: lav[50],
  accentBorder: lav[200],
  accentInk: lav[700],
  conflict: '#E5544A',
  conflictBg: '#FCE3E0',
  changed: '#B7791F',
  changedBg: '#FBEFD5',
  added: '#2E8B57',
  addedBg: '#DDF2E6',
  chip: 'rgba(255,255,255,0.72)',
  category: {
    school: { fill: lav[200], ink: lav[800] },
    work: { fill: '#FBDCC8', ink: '#7A3E1A' },
    personal: { fill: '#CDEBDD', ink: '#1F5A40' },
  } satisfies Record<Category, { fill: string; ink: string }>,
};

export type Palette = typeof light;

const dark: Palette = {
  canvas: '#0F0E13',
  header: '#17161C',
  row: '#1E1D24',
  surface: '#25242C',
  inkPrimary: '#F4F3F8',
  inkSecondary: '#A4A3AE',
  inkTertiary: '#6E6D78',
  line: '#2E2D35',
  nav: '#2A2931',
  navInactive: '#8C8B96',
  scrim: 'rgba(0,0,0,0.55)',
  accent: lav[300],
  accentSoft: '#1D1A2B',
  accentBorder: '#3A3160',
  accentInk: lav[300],
  conflict: '#F07A70',
  conflictBg: '#3A1D1B',
  changed: '#E2A84B',
  changedBg: '#3A2D14',
  added: '#5CC08A',
  addedBg: '#16301F',
  chip: 'rgba(255,255,255,0.12)',
  category: {
    school: { fill: lav[900], ink: '#E4DDFF' },
    work: { fill: '#4A2C1C', ink: '#FFD9C2' },
    personal: { fill: '#1C3A2D', ink: '#CDEBDD' },
  },
};

export const palettes = { light, dark } as const;

export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40 } as const;

export const radius = { chip: 999, row: 16, card: 20, sheet: 28, pill: 999 } as const;

/** Onest weights used by the app. Font family names match @expo-google-fonts/onest exports. */
export const fontFamily = {
  regular: 'Onest_400Regular',
  medium: 'Onest_500Medium',
  semibold: 'Onest_600SemiBold',
} as const;

export const typeScale = {
  displayXl: { size: 56, line: 56, weight: 'regular', tracking: -0.03 },
  display: { size: 34, line: 40, weight: 'medium', tracking: -0.02 },
  title: { size: 22, line: 28, weight: 'semibold', tracking: -0.01 },
  headline: { size: 17, line: 22, weight: 'semibold', tracking: 0 },
  body: { size: 16, line: 22, weight: 'regular', tracking: 0 },
  callout: { size: 15, line: 20, weight: 'regular', tracking: 0 },
  subhead: { size: 13, line: 18, weight: 'medium', tracking: 0 },
  caption: { size: 12, line: 16, weight: 'regular', tracking: 0.01 },
  overline: { size: 12, line: 16, weight: 'semibold', tracking: 0 },
} as const satisfies Record<
  string,
  { size: number; line: number; weight: keyof typeof fontFamily; tracking: number }
>;

export type TypeToken = keyof typeof typeScale;

export * from './wordmark';
