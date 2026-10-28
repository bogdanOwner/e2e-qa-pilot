import { test, expect } from './fixture.mjs';
import { bookChalet } from './flows/book-chalet.flow.mjs';

test('Reserve Chalet 4 and show the sent confirmation', async ({ cabin }) => {
  test.info().annotations.push(
    { type: 'spec', description: 'specs/book-chalet.md' },
    { type: 'page-contract', description: 'pages/cabin.md' },
  );
  await bookChalet(cabin);
  await expect(cabin.chalet4).toContainText('15% off');
  await expect(cabin.chalet4).toContainText('Free cancellation');
  await expect(cabin.selection).toContainText('Chalet 4');
  await expect(cabin.selection).toContainText('4 Aug 2026 – 5 Aug 2026');
  await expect(cabin.selection).toContainText('497 RON');
  await expect(cabin.resultTitle).toHaveText('Your request was successfully sent.');
  await expect(cabin.reference).toBeVisible();
  await expect(cabin.unavailable).toBeVisible();
});
