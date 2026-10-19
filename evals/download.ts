import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const root = import.meta.dirname;
const assets = JSON.parse(readFileSync(resolve(root, 'sources.json'), 'utf8')) as { file: string; url: string; sha256: string }[];
for (const asset of assets) {
  const dest = resolve(root, asset.file);
  if (!dest.startsWith(resolve(root, 'inputs/public') + '/')) throw new Error('Asset path outside public inputs');
  const response = await fetch(asset.url);
  if (!response.ok) throw new Error(`${asset.file}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const hash = createHash('sha256').update(bytes).digest('hex');
  if (hash !== asset.sha256) throw new Error(`${asset.file}: source changed. Review the file and its labels before updating its hash.`);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, bytes);
  console.log(`Downloaded and verified ${asset.file}`);
}
