import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/stored-pages.spec.mjs',
  timeout: 30_000,
  expect: { timeout: 5_000 },
});
