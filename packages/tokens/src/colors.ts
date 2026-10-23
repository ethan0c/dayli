/** Color primitives shared by the app, website, and generated brand assets. */
export const colors = {
  ink: '#222320',
  white: '#FFFFFF',
  paper: '#FAF9F6',
  paperRow: '#F0EFEB',
  paperLine: '#E5E4DE',
  mutedInk: '#686963',
  outline: '#82837B',
  darkCanvas: '#151515',
  darkSurface: '#202020',
  darkRow: '#292929',
  darkLine: '#363632',
  darkInk: '#F5F4F0',
  darkMutedInk: '#B4B4AC',
  darkOutline: '#92938A',
  siteRow: '#F4F4F5',
  siteLine: '#E7E7EA',
  purple: '#7057BD',
  purpleOnDark: '#C3AFF8',
  purpleSoft: '#F0ECF8',
  purpleBorder: '#DCD4EF',
  purpleSoftDark: '#2B253A',
  purpleBorderDark: '#453B5A',
  // Muted data marks remain quieter than interactive purple.
  purpleChart: '#76658F',
  // Everything that isn't work on a chart: a slate blue as quiet as the plum (4.9:1 / 7.5:1 on the
  // track) and far from terracotta, green and amber, so a kind never reads as a status.
  slateChart: '#2F6E8F',
  slateOnDark: '#8FC0E0',
} as const;

/** The app mark stays dark in either appearance, independently of button and text colors. */
export const appIconColors = {
  background: colors.darkCanvas,
  foreground: colors.white,
  accent: colors.purpleOnDark,
} as const;
