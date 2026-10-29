import { test, expect } from '@playwright/test';
import { CabinPage } from './pages/cabin.page.mjs';
import { storedPage } from './stored-page.mjs';

test('Ready case on the stored pages', async ({ page }) => {
  const cabin = new CabinPage(page);

  await page.goto(storedPage('availability.html'), { waitUntil: 'domcontentloaded' });
  await expect(cabin.chalet4).toContainText('497 EUR');
  await expect(cabin.chalet4).toContainText('15% off');
  await expect(cabin.chalet4).toContainText('Free cancellation');
  await expect(cabin.unavailable).toBeVisible();

  await page.goto(storedPage('selection.html'), { waitUntil: 'domcontentloaded' });
  await expect(cabin.selection).toContainText('Chalet 4');
  await expect(cabin.selection).toContainText('497 EUR');

  await page.goto(storedPage('sent.html'), { waitUntil: 'domcontentloaded' });
  await expect(cabin.resultTitle).toHaveText('Your request was successfully sent.');
  await expect(cabin.reference).toBeVisible();
});
