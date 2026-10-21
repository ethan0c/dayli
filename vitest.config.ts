import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';

// `@/` means apps/mobile/src in the app and apps/web in the site, so it resolves by the
// importing file's app rather than through one global alias.
const appAlias: Plugin = {
  name: 'app-alias',
  enforce: 'pre',
  resolveId(source, importer) {
    if (!source.startsWith('@/') || !importer) return null;
    const app = importer.includes('/apps/mobile/') ? resolve(__dirname, 'apps/mobile/src') : importer.includes('/apps/web/') ? resolve(__dirname, 'apps/web') : null;
    return app ? this.resolve(resolve(app, source.slice(2)), importer, { skipSelf: true }) : null;
  },
};

export default defineConfig({
  plugins: [appAlias],
  // Absolute, so a run started inside a package (packages/core) still finds it.
  test: { setupFiles: [resolve(__dirname, 'vitest.setup.ts')] },
  // These tests exercise plain TypeScript across both apps. Avoid loading the
  // native app's Expo tsconfig while Vite transforms its shared API client.
  esbuild: { tsconfigRaw: '{"compilerOptions":{"target":"ES2020"}}' },
});
