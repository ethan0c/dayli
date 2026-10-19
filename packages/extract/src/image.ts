import sharp from 'sharp';
import type { ExtractRequest } from '@dayli/schema';

type ImageInput = Extract<ExtractRequest['input'], { kind: 'image' }>;

/** Give small screenshot text more vision patches without changing its content.
 * Keep already large, animated, and orientation-tagged images in their original form. */
export async function prepareImage(input: ImageInput): Promise<ImageInput> {
  try {
    const source = sharp(Buffer.from(input.data, 'base64'), { limitInputPixels: 40_000_000 });
    const { width, height, pages, orientation } = await source.metadata();
    if (!width || !height || (pages ?? 1) > 1 || (orientation ?? 1) > 1) return input;
    const longest = Math.max(width, height);
    if (longest >= 1568) return input;
    const scale = Math.min(2, 1568 / longest);
    const bytes = await source.resize({ width: Math.round(width * scale), height: Math.round(height * scale), fit: 'inside' }).png().toBuffer();
    // Don't turn a compact photograph into an oversized provider request.
    if (bytes.length > 5 * 1024 * 1024) return input;
    return { kind: 'image', mediaType: 'image/png', data: bytes.toString('base64') };
  } catch {
    // Leave unsupported or damaged inputs to the provider's normal validation.
    return input;
  }
}
