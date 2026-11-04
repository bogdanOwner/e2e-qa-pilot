export const stay = {
  checkIn: '2026-08-04',
  checkOut: '2026-08-05',
  checkInLabel: '4 Aug 2026',
  checkOutLabel: '5 Aug 2026',
  firstName: 'Ana',
  lastName: 'Pop',
  email: 'ana.pop@example.com',
  rate: '497 EUR',
};

const pageContract = 'pages/cabin.md';

export async function selectChalet(cabin) {
  await cabin.searchStay(stay);
  await cabin.chaletRate.click();
}

export async function confirmStay(cabin) {
  await cabin.reserve.click();
  await cabin.page.waitForURL(/\/booking(\?|$)/);
  await cabin.fillGuest(stay);
  await cabin.confirm.click();
}

export async function searchStay(cabin) {
  await cabin.searchStay(stay);
}

export async function increaseChaletRate(cabin) {
  await cabin.chaletRate.click();
}

export async function openGuestForm(cabin) {
  await cabin.reserve.click();
  await cabin.page.waitForURL(/\/booking(\?|$)/);
}

export async function enterGuest(cabin) {
  await cabin.fillGuest(stay);
}

export async function confirmBooking(cabin) {
  await cabin.confirm.click();
}

export async function captureStep(testInfo, step, locator, name) {
  testInfo.annotations.push({
    type: 'case-step',
    description: step,
  });
  testInfo.annotations.push({
    type: 'page-contract',
    description: pageContract,
  });
  await locator.scrollIntoViewIfNeeded();
  const file = testInfo.outputPath(name);
  await locator.screenshot({ path: file });
  return file;
}
