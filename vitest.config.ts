import { defineConfig } from 'vitest/config';

export default defineConfig({
  // These tests exercise plain TypeScript across both apps. Avoid loading the
  // native app's Expo tsconfig while Vite transforms its shared API client.
  esbuild: { tsconfigRaw: '{"compilerOptions":{"target":"ES2020"}}' },
});
