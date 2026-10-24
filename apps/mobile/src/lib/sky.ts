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

/**
 * How each sky meets the header in light mode, measured with `design/check-sky.py`. An `ink` sky
 * is light enough for ink at 4.5:1 under `wash` of the page colour (0 shows the photo at full
 * strength). A `light` sky is dark: the header over it takes the dark palette, and the photo is
 * drawn tall enough that its dark part, the top `darkTo` of the frame, reaches past the day bar.
 * Dark mode always shows the night sky with light text.
 */
export const SKY_LOOK: Record<SkySlot, { text: 'ink' | 'light'; wash: number; darkTo?: number }> = {
  dawn: { text: 'ink', wash: 0 },
  morning: { text: 'ink', wash: 0 },
  afternoon: { text: 'ink', wash: 0 },
  // A mid-tone sky: too dark for ink without a wash, too light for white text. Until a new photo.
  golden: { text: 'ink', wash: 0.34 },
  night: { text: 'light', wash: 0, darkTo: 0.65 },
};

/** True when the header's text over this sky should be light: dark mode, or a dark photo in light mode. */
export function skyTextLight(slot: SkySlot, dark: boolean): boolean {
  return dark || SKY_LOOK[slot].text === 'light';
}
