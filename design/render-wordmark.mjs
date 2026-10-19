/** Render outlined wordmark assets. Run after generate-wordmark.py. */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = (name) => path.join(root, name);
const splash = await sharp(file('design/splash-icon.svg'))
  .resize(800, 800, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
await sharp(splash).toFile(file('design/splash-icon.png'));
await sharp(splash).toFile(file('apps/mobile/assets/images/splash-icon.png'));

for (const page of ['', 'pricing', 'syllabus-to-calendar', 'assignment-tracker', 'work-and-school-schedule-planner']) {
  const input = page ? `design/og-${page}.svg` : 'design/og.svg';
  const output = `apps/web/app/${page ? `${page}/` : ''}opengraph-image.png`;
  const png = await sharp(file(input)).resize(1200, 630, { fit: 'cover', position: 'centre' }).png().toBuffer();
  await sharp(png).toFile(file(output));
  if (!page) await sharp(png).toFile(file('design/og-1200x630.png'));
}
