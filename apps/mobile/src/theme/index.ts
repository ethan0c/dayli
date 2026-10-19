import { fontFamily, palettes, radius, space, typeScale, type Palette, type TypeToken } from '@dayli/tokens';
import { useColorScheme, type TextStyle } from 'react-native';

export { radius, space };
export type { Palette, TypeToken };

export function useTheme(): { c: Palette; dark: boolean } {
  const dark = useColorScheme() === 'dark';
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

/** Space left under scrolling content so the floating nav bar never covers the last row. */
export const NAV_INSET = 104;
