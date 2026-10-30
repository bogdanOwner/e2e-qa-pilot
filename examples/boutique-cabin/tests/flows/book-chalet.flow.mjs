export async function selectChalet(cabin) {
  await cabin.searchStay();
  await cabin.chaletRate.click();
}

export async function confirmStay(cabin) {
  await cabin.reserve.click();
  await cabin.page.waitForURL(/\/booking(\?|$)/);
  await cabin.fillGuest();
  await cabin.confirm.click();
}
