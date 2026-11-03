import { test, expect } from './fixture.mjs';
import {
  captureStep,
  caseSteps,
  chalet4Stay,
  chooseStayDates,
  enterGuest,
  increaseChalet4,
  openConfirmPage,
  searchAvailability,
  submitBooking,
} from './flows/book-chalet.flow.mjs';

test.use({ viewport: { width: 1440, height: 1000 } });

test('Book Chalet 4 at Cabana', async ({ cabin }, testInfo) => {
  testInfo.annotations.push({
    type: 'spec',
    description: 'specs/book-chalet-4-at-cabana.md',
  });

  await chooseStayDates(cabin);
  await expect(cabin.checkIn).toHaveValue(chalet4Stay.checkIn);
  await expect(cabin.checkOut).toHaveValue(chalet4Stay.checkOut);
  await captureStep(testInfo, caseSteps.search, cabin.searchSection, 'stay-dates.png');

  await searchAvailability(cabin);
  await expect(cabin.chalet4).toContainText('497 EUR');
  await expect(cabin.chalet4).toContainText('15% off');
  await expect(cabin.chalet4).toContainText('Free cancellation');
  await expect(cabin.chalet1).toContainText('Not available for selected dates');
  await cabin.chalet4.evaluate((card) => card.scrollIntoView({ block: 'center' }));
  await captureStep(testInfo, caseSteps.search, cabin.chalet4, 'chalet-4-rate.png');
  await cabin.chalet1.evaluate((card) => card.scrollIntoView({ block: 'center' }));
  await captureStep(testInfo, caseSteps.search, cabin.chalet1, 'chalet-1-unavailable.png');

  await increaseChalet4(cabin);
  await expect(cabin.selection).toContainText('Chalet 4');
  await expect(cabin.selectionTotal).toHaveText('497 EUR');
  await captureStep(testInfo, caseSteps.reserve, cabin.selection, 'chalet-4-selection.png');

  await openConfirmPage(cabin);
  await expect(cabin.page).toHaveURL(/\/booking(\?|$)/);
  await expect(cabin.confirmRoom).toHaveText('Chalet 4');
  await expect(cabin.confirmSummary).toContainText('497 EUR');
  await expect(cabin.firstName).toBeVisible();
  await expect(cabin.lastName).toBeVisible();
  await expect(cabin.email).toBeVisible();
  await captureStep(testInfo, caseSteps.reserve, cabin.confirmPage, 'guest-form.png');

  await enterGuest(cabin);
  await expect(cabin.firstName).toHaveValue(chalet4Stay.firstName);
  await expect(cabin.lastName).toHaveValue(chalet4Stay.lastName);
  await expect(cabin.email).toHaveValue(chalet4Stay.email);
  await expect(cabin.terms).toBeChecked();
  await captureStep(testInfo, caseSteps.confirm, cabin.confirmPage, 'guest-details.png');

  await submitBooking(cabin);
  await expect(cabin.resultTitle).toHaveText('Your request was successfully sent.');
  await expect(cabin.reference).toBeVisible();
  await captureStep(testInfo, caseSteps.confirm, cabin.success, 'booking-sent.png');
});
