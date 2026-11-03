export const chalet4Stay = {
  checkIn: '2026-08-04',
  checkOut: '2026-08-05',
  checkInLabel: '4 Aug 2026',
  checkOutLabel: '5 Aug 2026',
  firstName: 'Ana',
  lastName: 'Pop',
  email: 'ana.pop@example.com',
};

export const caseSteps = {
  search: '1. Set check-in to 4 Aug 2026 and check-out to 5 Aug 2026, then click Search.',
  reserve: '2. Press Increase quantity on the Chalet 4 rate priced at 497 EUR, then click Reserve Now.',
  confirm: '3. Enter First Name "Ana", Last Name "Pop", and Email Address "ana.pop@example.com", accept the terms, and click Confirm Booking.',
};

const pageContract = 'pages/cabin.md';

export async function captureStep(testInfo, step, locator, fileName) {
  testInfo.annotations.push({
    type: 'case-step',
    description: step,
  });
  testInfo.annotations.push({
    type: 'page-contract',
    description: pageContract,
  });
  await locator.screenshot({ path: testInfo.outputPath(fileName) });
}

export async function selectChalet(cabin) {
  await cabin.searchStay(chalet4Stay.checkIn, chalet4Stay.checkOut);
  await cabin.chaletRate.click();
}

export async function confirmStay(cabin) {
  await cabin.reserve.click();
  await cabin.page.waitForURL(/\/booking(\?|$)/);
  await cabin.fillGuest(chalet4Stay);
  await cabin.confirm.click();
}

export async function chooseStayDates(cabin) {
  await cabin.chooseStay(chalet4Stay.checkIn, chalet4Stay.checkOut);
}

export async function searchAvailability(cabin) {
  await cabin.search.click();
  await cabin.chaletRate.waitFor();
  await cabin.chalet1.waitFor();
}

export async function increaseChalet4(cabin) {
  await cabin.chaletRate.click();
  await cabin.selection.getByText('Chalet 4').waitFor();
  await cabin.selectionTotal.waitFor();
}

export async function enterGuest(cabin) {
  await cabin.fillGuest(chalet4Stay);
}

export async function openConfirmPage(cabin) {
  await cabin.reserve.click();
  await cabin.page.waitForURL(/\/booking(\?|$)/);
  await cabin.confirmRoom.waitFor();
  await cabin.firstName.waitFor();
}

export async function submitBooking(cabin) {
  await cabin.confirm.click();
  await cabin.resultTitle.waitFor();
  await cabin.reference.waitFor();
}
