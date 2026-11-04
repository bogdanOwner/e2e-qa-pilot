import { test, expect } from './fixture.mjs';
import {
  captureStep,
  confirmBooking,
  enterGuest,
  increaseChaletRate,
  openGuestForm,
  searchStay,
  stay,
} from './flows/book-chalet.flow.mjs';

const step1 = '1. Set check-in to 4 Aug 2026 and check-out to 5 Aug 2026, then click Search.';
const step2 = '2. Press Increase quantity on the Chalet 4 rate priced at 497 EUR, then click Reserve Now.';
const step3 = '3. Enter First Name "Ana", Last Name "Pop", and Email Address "ana.pop@example.com", accept the terms, and click Confirm Booking.';

test('Book Chalet 4 with the case confirmation sentence', async ({ cabin }, testInfo) => {
  testInfo.annotations.push(
    { type: 'spec', description: 'specs/book-chalet-4-with-the-case-confirmation-sentence.md' },
    { type: 'page-contract', description: 'pages/cabin.md' },
  );

  await searchStay(cabin);
  await expect(cabin.chalet4).toContainText(stay.rate);
  await expect(cabin.chalet4).toContainText('15% off');
  await expect(cabin.chalet4).toContainText('Free cancellation');
  await expect(cabin.chalet1).toContainText('Not available for selected dates');
  await captureStep(testInfo, step1, cabin.chalet4, 'chalet-4-rate.png');
  await captureStep(testInfo, step1, cabin.chalet1, 'chalet-1-unavailable.png');

  await increaseChaletRate(cabin);
  await expect(cabin.selection).toContainText('Chalet 4');
  await expect(cabin.selection).toContainText(stay.rate);
  await captureStep(testInfo, step2, cabin.selection, 'chalet-4-selection.png');
  await openGuestForm(cabin);
  await expect(cabin.firstName).toBeVisible();
  await captureStep(testInfo, step2, cabin.guestForm, 'guest-form.png');

  await enterGuest(cabin);
  await expect(cabin.firstName).toHaveValue(stay.firstName);
  await expect(cabin.lastName).toHaveValue(stay.lastName);
  await expect(cabin.email).toHaveValue(stay.email);
  await expect(cabin.terms).toBeChecked();
  await captureStep(testInfo, step3, cabin.guestForm, 'guest-form-filled.png');

  await confirmBooking(cabin);
  await expect(cabin.resultTitle).toBeVisible();
  await expect(cabin.referenceLine).toBeVisible();
  await expect(cabin.referenceLine).toContainText('Booking reference');
  const screenSentence = (await cabin.resultTitle.innerText()).trim();
  testInfo.annotations.push({ type: 'screen-sentence', description: screenSentence });
  await captureStep(testInfo, step3, cabin.success, 'booking-sent.png');
});
