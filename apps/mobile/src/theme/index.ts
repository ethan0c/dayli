import { fontFamily, palettes, radius, space, typeScale, type Palette, type TypeToken } from '@dayli/tokens';
import { useColorScheme, type TextStyle } from 'react-native';

import { useStore } from '@/store';

export { radius, space };
export type { Palette, TypeToken };

/** Palette for the current appearance: the user's choice in You, or the system setting. */
export function useTheme(): { c: Palette; dark: boolean } {
  const scheme = useColorScheme();
  const pref = useStore((s) => s.settings.appearance);
  const dark = pref === 'dark' || (pref !== 'light' && scheme === 'dark');
  return { c: dark ? palettes.dark : palettes.light, dark };
}

export function textStyle(token: TypeToken, color: string): TextStyle {
  const t = typeScale[token];
  return {
    fontFamily: fontFamily[t.weight],
    fontSize: t.size,
    lineHeight: t.line,
    letterSpacing: t.size * t.tracking,
    color,
  };
}

/** The Today header follows the day: butter in the morning, sky in the afternoon, lavender at night. */
export function dayTint(c: Palette, hour: number): string {
  if (hour < 5) return c.tint.lavender.fill;
  if (hour < 12) return c.tint.butter.fill;
  if (hour < 17) return c.tint.sky.fill;
  return c.tint.lavender.fill;
}

/** Shared horizontal screen margin, based on the Cal AI app reference. */
export const SCREEN_GUTTER = space.xl;

/** Space left under scrolling content so the tab bar never covers the last row. */
export const NAV_INSET = 104;
