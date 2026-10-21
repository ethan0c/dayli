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
  // Keep the persisted `rose` key; its visual tint is now muted clay.
  rose: { fill: '#E6D9CF', ink: '#604535' },
};

const darkTint: Record<TintName, Tint> = {
  lavender: { fill: lav[900], ink: '#E4DDFF' },
  apricot: { fill: '#4A2C1C', ink: '#FFD9C2' },
  mint: { fill: '#1C3A2D', ink: '#CDEBDD' },
  sky: { fill: '#1B2E4A', ink: '#CFE3FF' },
  butter: { fill: '#433714', ink: '#FFE9A8' },
  rose: { fill: '#3D332C', ink: '#D8C0AE' },
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
  controlFill: '#222320',
  controlInk: '#FFFFFF',
  selectionFill: '#F0EFEB',
  selectionInk: '#222320',
  disclosureInk: '#686963',
  chartBooked: '#76658F',
  chartOnBooked: '#FFFFFF',
  conflict: '#9F431F',
  conflictBg: '#F8EDE5',
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
  controlFill: '#C3AFF8',
  controlInk: '#151515',
  selectionFill: '#2B253A',
  selectionInk: '#C3AFF8',
  disclosureInk: '#C3AFF8',
  chartBooked: '#C3AFF8',
  chartOnBooked: '#151515',
  conflict: '#E8A274',
  conflictBg: '#3A2A20',
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
 * Chart geometry, shared by every timeline in the app and the site mockups. A mark is
 * centred on its value, never offset from it: `track` is the line's thickness, `dot` a due
 * date, `ring` a quiz (with `ringStroke`; `targetDot` is the centre that makes it an exam), `halo` the canvas cut-out around both, `focusGap` the space inside a picked mark's ink focus ring, `now` the now hairline that overhangs the track
 * by `nowOverhang` on each side (`nowColumnOverhang` past a week column), `nowDot` the dot
 * at its start in the hour view, `labelGap` the least space between two labels under a line.
 */
export const chart = { track: 6, column: 6, dot: 8, ring: 12, ringStroke: 2, targetDot: 4, halo: 1.5, focusGap: 2, now: 1.5, nowOverhang: 5, nowColumnOverhang: 2, nowDot: 7, labelGap: 8 } as const;

/**
 * Geist, one face, four weights (apps/mobile/assets/fonts, OFL). Regular carries
 * large headings, numbers, section titles and text, Medium pills and primary labels,
 * and SemiBold emphasis. EB Garamond Regular (OFL) is the marketing
 * voice: only `displaySerif`, on the few lines that speak to the student (the paywall
 * tagline, the Plus welcome, the auth welcome, the onboarding showcases, the site hero).
 * Never on numbers, rows, forms or the big number. The outlined wordmark uses Onest.
 */
export const fontFamily = {
  light: 'Geist-Light',
  regular: 'Geist-Regular',
  medium: 'Geist-Medium',
  semibold: 'Geist-SemiBold',
  serif: 'EBGaramond-Regular',
} as const;

/** Every large heading uses normal (Geist Regular, 400), regardless of its size. */
const largeHeadingWeight = 'regular' as const;

export const typeScale = {
  /** The one big number on a screen: countdown, price, moment. */
  displayXl: { size: 56, line: 60, weight: largeHeadingWeight, tracking: -0.035 },
  /** Screen heading on covers. */
  display: { size: 34, line: 40, weight: largeHeadingWeight, tracking: -0.02 },
  /** The same heading in the marketing serif: paywall, Plus welcome, auth welcome, showcases. */
  displaySerif: { size: 34, line: 40, weight: 'serif', tracking: -0.01 },
  /** Onboarding questions and editable item titles. */
  displaySm: { size: 30, line: 36, weight: largeHeadingWeight, tracking: -0.02 },
  /** Section titles, with a chevron. */
  title: { size: 24, line: 30, weight: 'regular', tracking: -0.015 },
  /** Button labels. */
  headline: { size: 16, line: 22, weight: 'medium', tracking: 0 },
  body: { size: 16, line: 22, weight: 'regular', tracking: 0 },
  callout: { size: 14, line: 20, weight: 'regular', tracking: 0 },
  /** Text buttons and pills. */
  subhead: { size: 13, line: 18, weight: 'medium', tracking: 0 },
  /** Never smaller. */
  caption: { size: 12, line: 16, weight: 'regular', tracking: 0 },
  /** Sentence-case group labels. */
  overline: { size: 13, line: 18, weight: 'medium', tracking: 0 },
} as const satisfies Record<
  string,
  { size: number; line: number; weight: keyof typeof fontFamily; tracking: number }
>;

export type TypeToken = keyof typeof typeScale;

export * from './wordmark';
export * from './motion';
