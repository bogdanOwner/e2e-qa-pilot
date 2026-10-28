import { test, expect } from '@playwright/test';
import { CabinPage } from './pages/cabin.page.mjs';
import { storedPage } from './stored-page.mjs';

test('Confirmation title is not shown when booking times out', async ({ page }) => {
  const cabin = new CabinPage(page);
  await page.goto(storedPage('timeout.html'), { waitUntil: 'domcontentloaded' });
  await expect(cabin.resultTitle).toBeVisible();
  await expect(cabin.resultTitle).toHaveText('Your request was successfully sent.', { timeout: 1000 });
  await expect(cabin.reference).toBeVisible({ timeout: 1000 });
});
