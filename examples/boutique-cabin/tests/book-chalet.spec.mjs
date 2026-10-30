import { test, expect } from './fixture.mjs';
import { confirmStay, selectChalet } from './flows/book-chalet.flow.mjs';

test('Reserve Chalet 4 and show the sent confirmation', async ({ cabin }) => {
  test.info().annotations.push(
    { type: 'spec', description: 'specs/book-chalet.md' },
    { type: 'page-contract', description: 'pages/cabin.md' },
  );
  await selectChalet(cabin);
  await expect(cabin.chalet4).toContainText('15% off');
  await expect(cabin.chalet4).toContainText('Free cancellation');
  await expect(cabin.selection).toContainText('Chalet 4');
  await expect(cabin.selection).toContainText('497 EUR');
  await expect(cabin.unavailable).toBeVisible();
  await confirmStay(cabin);
  await expect(cabin.resultTitle).toHaveText('Your request was successfully sent.');
  await expect(cabin.reference).toBeVisible();
});
