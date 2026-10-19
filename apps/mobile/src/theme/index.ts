import { fontFamily, palettes, radius, space, typeScale, type Palette, type TypeToken } from '@dayli/tokens';
import { useColorScheme, type TextStyle, type ViewStyle } from 'react-native';

import { useStore } from '@/store';

export { radius, space };
export type { Palette, TypeToken };

/** Readable UI text. The outlined brand wordmark stays independent. */
export const mobileFonts = fontFamily;

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
    fontFamily: mobileFonts[t.weight],
    fontSize: t.size,
    lineHeight: t.line,
    letterSpacing: t.size * t.tracking,
    color,
  };
}

/** One persisted treatment for featured content; agenda rows remain open. */
export function useCardSurface(tone: 'neutral' | 'accent' = 'neutral'): ViewStyle {
  const { c, dark } = useTheme();
  const raised = useStore((s) => s.settings.cardStyle) === 'raised';
  return {
    backgroundColor: tone === 'accent' ? c.accentSoft : c.surface,
    borderRadius: radius.card,
    borderWidth: raised ? 1 : 0,
    borderColor: tone === 'accent' ? c.accentBorder : c.line,
    boxShadow: raised ? `0 3px 16px ${dark ? 'rgba(0,0,0,0.22)' : 'rgba(34,35,32,0.06)'}` : 'none',
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
export const NAV_INSET = 140;
