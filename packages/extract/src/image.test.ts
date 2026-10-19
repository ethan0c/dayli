import { expect, it } from 'vitest';
import sharp from 'sharp';
import { prepareImage } from './image';

it('enlarges a small screenshot within a bounded vision size and preserves its aspect ratio', async () => {
  const bytes = await sharp({ create: { width: 800, height: 450, channels: 3, background: '#ffffff' } }).png().toBuffer();
  const output = await prepareImage({ kind: 'image', mediaType: 'image/png', data: bytes.toString('base64') });
  const meta = await sharp(Buffer.from(output.data, 'base64')).metadata();
  expect(meta).toMatchObject({ format: 'png', width: 1568, height: 882 });
});

it('keeps large images unchanged instead of discarding readable detail', async () => {
  const bytes = await sharp({ create: { width: 1800, height: 600, channels: 3, background: '#ffffff' } }).png().toBuffer();
  const input = { kind: 'image' as const, mediaType: 'image/png' as const, data: bytes.toString('base64') };
  expect(await prepareImage(input)).toBe(input);
});

it('leaves invalid image bytes to normal extraction validation', async () => {
  const input = { kind: 'image' as const, mediaType: 'image/png' as const, data: 'not-an-image' };
  expect(await prepareImage(input)).toBe(input);
});
