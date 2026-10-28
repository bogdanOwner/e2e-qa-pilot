import { test as base, expect } from '@playwright/test';
import { CabinPage } from './pages/cabin.page.mjs';

export const test = base.extend({
  cabin: async ({ page }, use) => {
    const cabin = new CabinPage(page);
    await cabin.open();
    await use(cabin);
  },
});

export { expect };
