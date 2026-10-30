import { test, expect } from './fixture.mjs';
import { reserveChalet, searchAvailability, sendBooking } from './flows/book-chalet.flow.mjs';

test('Book Chalet 4 at Cabana', async ({ cabin }, testInfo) => {
  test.info().annotations.push({ type: 'spec', description: 'specs/book-chalet-4-at-cabana.md' });

  await searchAvailability(cabin, testInfo);
  await expect(cabin.page.locator('#booking-check-in')).toHaveValue('2026-08-04');
  await expect(cabin.page.locator('#booking-check-out')).toHaveValue('2026-08-05');
  await expect(cabin.chalet4).toContainText('497 EUR');
  await expect(cabin.chalet4).toContainText('15% off');
  await expect(cabin.chalet4).toContainText('Free cancellation');
  await expect(cabin.chalet1).toContainText('Not available for selected dates');

  await reserveChalet(cabin, testInfo);
  await expect(cabin.page).toHaveURL(/\/booking(\?|$)/);
  await expect(cabin.confirmRoom).toHaveText('Chalet 4');
  await expect(cabin.confirmPricing).toContainText('497 EUR');
  await expect(cabin.guestForm).toBeVisible();
  await expect(cabin.firstName).toBeVisible();
  await expect(cabin.lastName).toBeVisible();
  await expect(cabin.email).toBeVisible();

  await sendBooking(cabin, testInfo);
  await expect(cabin.resultTitle).toHaveText('Your request was successfully sent.');
  await expect(cabin.reference).toHaveText('Booking reference: CAB-1042');
});
