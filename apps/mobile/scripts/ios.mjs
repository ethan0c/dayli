// `npm run ios`: regenerates ios/ when the native side changed since it was last generated
// (a native package added or upgraded, a config plugin, app.json), then builds and runs.
// `expo run:ios` alone reuses an existing ios/ folder, so a new native module never gets linked.
// Extra arguments pass through: `npm run ios -- --device`.
import { createFingerprintAsync } from '@expo/fingerprint';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const STAMP = 'ios/.native-fingerprint';
const run = (args) => {
  const { status } = spawnSync('npx', args, { stdio: 'inherit' });
  if (status !== 0) process.exit(status ?? 1);
};

const { hash } = await createFingerprintAsync('.', { platforms: ['ios'] });
const last = existsSync(STAMP) ? readFileSync(STAMP, 'utf8').trim() : null;
if (last !== hash) {
  console.log(last ? 'Native side changed since ios/ was generated: regenerating.' : 'Generating ios/.');
  run(['expo', 'prebuild', '--platform', 'ios', '--clean']);
  writeFileSync(STAMP, hash + '\n');
}
run(['expo', 'run:ios', ...process.argv.slice(2)]);
