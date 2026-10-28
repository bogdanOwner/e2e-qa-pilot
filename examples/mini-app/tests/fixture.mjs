import { test as base, expect } from '@playwright/test';
import { DiaryPage } from './pages/diary.page.mjs';

export const test = base.extend({
  diary: async ({ page }, use) => {
    const diary = new DiaryPage(page);
    await diary.open();
    await use(diary);
  },
});

export { expect };
