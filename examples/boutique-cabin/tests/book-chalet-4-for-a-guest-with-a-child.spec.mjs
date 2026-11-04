import { test, expect } from './fixture.mjs';
import {
  captureStep,
  childGuest,
  chooseChild,
  confirmGuests,
  reserveChalet,
  searchDates,
} from './flows/book-chalet.flow.mjs';

const step1 = '1. Open the Guests picker, increase Children to 1, choose age 5 for the child, and click Done.';

test('Book Chalet 4 for a guest with a child', async ({ cabin }, testInfo) => {
  testInfo.annotations.push(
    { type: 'spec', description: 'specs/book-chalet-4-for-a-guest-with-a-child.md' },
    { type: 'page-contract', description: 'pages/cabin.md' },
  );

  await chooseChild(cabin);
  await expect(cabin.childrenCount).toHaveText(String(childGuest.children));
  await expect(cabin.childAge).toHaveValue(childGuest.childAge);

  await confirmGuests(cabin);
  const summary = (await cabin.guestsSummary.innerText()).trim();
  const pickerOpen = await cabin.guestsPanel.isVisible();
  const selectAgeVisible = await cabin.childAgeError.isVisible();
  await testInfo.attach('step-1-screen', {
    body: `picker open: ${pickerOpen}\nsummary: ${summary}\nSelect age visible: ${selectAgeVisible}`,
    contentType: 'text/plain',
  });
  await captureStep(testInfo, step1, cabin.guestsPanel, 'guests-select-age.png');

  await expect(cabin.guestsPanel).toBeHidden();
  await expect(cabin.guestsSummary).toContainText('1 child');
  await expect(cabin.childAgeError).toBeHidden();

  await searchDates(cabin);
  await expect(cabin.chalet4).toContainText('497 EUR');
  await expect(cabin.chalet4).toContainText('15% off');
  await expect(cabin.chalet4).toContainText('Free cancellation');

  await reserveChalet(cabin);
  await expect(cabin.selection).toContainText('Chalet 4');
  await expect(cabin.selection).toContainText('497 EUR');
  await expect(cabin.firstName).toBeVisible();
});
