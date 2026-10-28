import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/mismatch.spec.mjs',
  timeout: 30_000,
  expect: { timeout: 1_000 },
});
