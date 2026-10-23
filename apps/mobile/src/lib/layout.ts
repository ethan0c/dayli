import { Platform, useWindowDimensions } from 'react-native';

/*
 * The web planner's widths (docs/design-system.md, "The web"). Under 768 it is the phone layout;
 * from 768 a sidebar replaces the tab pill and screens sit in a centred column; from 1200 the
 * sidebar shows labels and Today and Plan open a second pane. The iPhone never changes shape.
 */

export const SIDEBAR_AT = 768;
export const TWO_PANE_AT = 1200;
/** The reading column for one-pane screens. */
export const COLUMN = 720;
/** Room for Today's hours or Plan's detail beside the list. */
export const WIDE_COLUMN = 1180;

export function useWebLayout() {
  const { width } = useWindowDimensions();
  const web = Platform.OS === 'web';
  return { sidebar: web && width >= SIDEBAR_AT, twoPane: web && width >= TWO_PANE_AT };
}
