import { Image, type ImageRef } from 'expo-image';

import type { SkySlot } from '@/lib/sky';

/** Bundled photos, in one place so they can be decoded before the splash lifts. Credits: docs/photo-credits.md. */
export const SKY: Record<SkySlot, number> = {
  dawn: require('../../assets/images/sky/dawn.webp'),
  morning: require('../../assets/images/sky/morning.webp'),
  afternoon: require('../../assets/images/sky/afternoon.webp'),
  golden: require('../../assets/images/sky/golden.webp'),
  night: require('../../assets/images/sky/night.webp'),
};

/** The paywall's photo; onboarding's other showcases were removed Oct 21, 2026. */
export const SHOWCASE = {
  plus: require('../../assets/showcase/plus.jpg') as number,
};

const decoded = new Map<number, ImageRef>();

/** The decoded image when it is ready, so the first frame already has it; otherwise the source to load. */
export function photoSource(source: number): number | ImageRef {
  return decoded.get(source) ?? source;
}

export function isDecoded(source: number): boolean {
  return decoded.has(source);
}

/**
 * Decodes photos into memory, waiting at most `capMs` so a slow decode never holds the launch.
 * Anything not finished in time keeps decoding and is used once it is.
 */
export async function preloadPhotos(sources: number[], capMs = 300): Promise<void> {
  const work = Promise.all(sources.filter((s) => !decoded.has(s)).map((s) =>
    Image.loadAsync(s).then((ref) => { decoded.set(s, ref); }).catch(() => {})));
  await Promise.race([work, new Promise((resolve) => setTimeout(resolve, capMs))]);
}
