import { Platform, useWindowDimensions, type ViewStyle } from 'react-native';

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
/** The second pane: Today's hours, Plan's open item. */
export const PANE = WIDE_COLUMN - COLUMN;

/**
 * The frame every wide screen lines up on, so titles, lists and header buttons start at the same
 * place on every screen: the main column at the frame's left, and from 1200 a second pane's width
 * to its right. `panes` gives the whole frame to a screen that fills that pane (Today, Plan); every
 * other screen keeps to the main column and leaves the pane's width empty.
 */
export function frameStyle(twoPane: boolean, panes = false): ViewStyle {
  if (!twoPane) return { width: '100%', maxWidth: COLUMN, alignSelf: 'center' };
  return { width: '100%', maxWidth: WIDE_COLUMN, alignSelf: 'center', paddingRight: panes ? 0 : PANE };
}

export function useWebLayout() {
  const { width } = useWindowDimensions();
  const web = Platform.OS === 'web';
  return { sidebar: web && width >= SIDEBAR_AT, twoPane: web && width >= TWO_PANE_AT };
}
