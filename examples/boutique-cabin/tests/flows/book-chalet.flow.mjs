import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const shotDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../artifacts/case-shots');

function mark(testInfo, action, contract) {
  testInfo.annotations.push({
    type: 'case-step',
    description: action,
  });
  testInfo.annotations.push({
    type: 'page-contract',
    description: contract,
  });
}

async function shoot(locator, name, style) {
  fs.mkdirSync(shotDir, { recursive: true });
  await locator.screenshot({
    path: path.join(shotDir, name),
    ...(style ? { style } : {}),
  });
}

export async function selectChalet(cabin) {
  await cabin.searchStay();
  await cabin.chaletRate.click();
}

export async function searchAvailability(cabin, testInfo) {
  await cabin.searchStay();
  await cabin.chalet1.getByText('Not available for selected dates').waitFor();
  mark(
    testInfo,
    '1. Set check-in to 4 Aug 2026 and check-out to 5 Aug 2026, then click Search.',
    'pages/cabin.md',
  );
  await cabin.chalet4.evaluate((card) => card.scrollIntoView({ block: 'center' }));
  await shoot(
    cabin.roomList,
    'availability-results.png',
    'header, #example-banner { display: none !important; }',
  );
}

export async function reserveChalet(cabin, testInfo) {
  await cabin.chaletRate.click();
  await cabin.reserve.click();
  await cabin.page.waitForURL(/\/booking(\?|$)/);
  await cabin.confirmPage.waitFor();
  await cabin.confirmRoom.filter({ hasText: 'Chalet 4' }).waitFor();
  mark(
    testInfo,
    '2. Press Increase quantity on the Chalet 4 rate priced at 497 EUR, then click Reserve Now.',
    'pages/confirm.md',
  );
  await shoot(cabin.confirmPage, 'booking-confirm.png');
}

export async function sendBooking(cabin, testInfo) {
  await cabin.fillGuest();
  await cabin.confirm.click();
  await cabin.resultTitle.waitFor();
  await cabin.reference.waitFor();
  mark(
    testInfo,
    '3. Enter First Name, Last Name, and Email Address, accept the terms, and click Confirm Booking.',
    'pages/confirm.md',
  );
  await shoot(cabin.success, 'booking-sent.png');
}

export async function confirmStay(cabin) {
  await cabin.reserve.click();
  await cabin.page.waitForURL(/\/booking(\?|$)/);
  await cabin.fillGuest();
  await cabin.confirm.click();
}
