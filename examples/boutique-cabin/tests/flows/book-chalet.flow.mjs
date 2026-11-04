export const childGuest = {
  children: 1,
  childAge: '5',
};

const pageContract = 'pages/cabin.md';

export async function selectChalet(cabin) {
  await cabin.searchStay();
  await cabin.chaletRate.click();
}

export async function chooseChild(cabin) {
  await cabin.openGuests();
  await cabin.setChildren(childGuest.children);
  await cabin.childAge.selectOption(childGuest.childAge);
}

export async function confirmGuests(cabin) {
  await cabin.guestsTrigger.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await cabin.guestsDone.click();
}

export async function searchDates(cabin) {
  await cabin.searchStay();
}

export async function reserveChalet(cabin) {
  await cabin.chaletRate.click();
  await cabin.reserve.click();
  await cabin.page.waitForURL(/\/booking(\?|$)/);
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

export async function confirmStay(cabin) {
  await cabin.reserve.click();
  await cabin.page.waitForURL(/\/booking(\?|$)/);
  await cabin.fillGuest();
  await cabin.confirm.click();
}
