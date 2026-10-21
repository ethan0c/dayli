/** Today's sky: which of the five photos fits the hour. Dark mode is always the night sky. */
export type SkySlot = 'dawn' | 'morning' | 'afternoon' | 'golden' | 'night';

/** Dawn 5–8, morning 8–12, afternoon 12–17, golden hour 17–20, night 20–5, from the phone's clock. */
export function skySlot(time: string, dark: boolean): SkySlot {
  if (dark) return 'night';
  const h = Number(time.slice(0, 2));
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 20) return 'golden';
  return 'night';
}
