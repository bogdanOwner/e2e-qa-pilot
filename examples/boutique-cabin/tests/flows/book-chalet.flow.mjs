export async function bookChalet(cabin) {
  await cabin.checkIn.fill('2026-08-04');
  await cabin.checkOut.fill('2026-08-05');
  await cabin.search.click();
  await cabin.chaletRate.click();
  await cabin.firstName.fill('Ana');
  await cabin.lastName.fill('Pop');
  await cabin.email.fill('ana.pop@example.com');
  await cabin.phone.fill('+40723441446');
  await cabin.terms.check();
  await cabin.confirm.click();
}
