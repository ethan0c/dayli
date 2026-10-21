/** Regenerate the app icon, site icons and favicon from the shared color primitives. */
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const { appIconColors } = createRequire(import.meta.url)('../packages/tokens/src/colors.ts');

const file = (name) => fileURLToPath(new URL(`../${name}`, import.meta.url));
const source = file('design/icon-b-dots.svg');
let dot = 0;
const svg = (await readFile(source, 'utf8'))
  .replace(/(<rect\b[^>]*\bfill=")[^"]+/, `$1${appIconColors.background}`)
  .replace(/(<circle\b[^>]*\bfill=")[^"]+/g, (_, prefix) => `${prefix}${dot++ === 0 ? appIconColors.foreground : appIconColors.accent}`);
if (dot !== 2) throw new Error('Expected the two-dot app mark.');
await writeFile(source, svg);

for (const [name, size] of [
  ['apps/mobile/assets/images/icon.png', 1024],
  ['apps/mobile/assets/images/favicon.png', 196],
  ['apps/web/app/icon.png', 512],
  ['apps/web/app/apple-icon.png', 180],
]) {
  await sharp(Buffer.from(svg)).resize(size, size).flatten({ background: appIconColors.background }).png().toFile(file(name));
}

// ICO supports PNG entries; provide the common browser sizes without another dependency.
const sizes = [16, 32, 48, 256];
const images = await Promise.all(sizes.map((size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer()));
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
for (let i = 0; i < sizes.length; i++) {
  const at = 6 + i * 16;
  header[at] = header[at + 1] = sizes[i] === 256 ? 0 : sizes[i];
  header.writeUInt16LE(1, at + 4);
  header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(images[i].length, at + 8);
  header.writeUInt32LE(offset, at + 12);
  offset += images[i].length;
}
await writeFile(file('apps/web/app/favicon.ico'), Buffer.concat([header, ...images]));
