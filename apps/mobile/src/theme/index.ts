import { fontFamily, palettes, radius, space, typeScale, type Palette, type TypeToken } from '@dayli/tokens';
import { createContext, useContext } from 'react';
import { useColorScheme, type TextStyle } from 'react-native';

import { useStore } from '@/store';

export { radius, space };
export type { Palette, TypeToken };

/** Readable UI text. The outlined brand wordmark stays independent. */
export const mobileFonts = fontFamily;

/** Forces one appearance for a subtree, like a chart on a dark showcase page. */
export const ForceAppearance = createContext<'light' | 'dark' | null>(null);

/** Palette for the current appearance: a forced one, the user's choice in You, or the system setting. */
export function useTheme(): { c: Palette; dark: boolean } {
  const scheme = useColorScheme();
  const pref = useStore((s) => s.settings.appearance);
  const forced = useContext(ForceAppearance);
  const dark = forced ? forced === 'dark' : pref === 'dark' || (pref !== 'light' && scheme === 'dark');
  return { c: dark ? palettes.dark : palettes.light, dark };
}

export function textStyle(token: TypeToken, color: string): TextStyle {
  const t = typeScale[token];
  return {
    fontFamily: mobileFonts[t.weight],
    fontSize: t.size,
    lineHeight: t.line,
    letterSpacing: t.size * t.tracking,
    color,
  };
}

/** Shared horizontal screen margin, based on the Cal AI app reference. */
export const SCREEN_GUTTER = space.xl;

/** Space left under scrolling content so the tab bar never covers the last row. */
export const NAV_INSET = 140;
