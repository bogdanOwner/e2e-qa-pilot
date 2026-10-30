export class CabinPage {
  constructor(page) {
    this.page = page;
    this.search = page.locator('#availability-search-btn');
    this.roomList = page.locator('#availability-room-list');
    this.chalet4 = page.locator('[data-room-card]').filter({ hasText: 'Chalet 4' });
    this.chalet1 = page.locator('[data-room-card="chalet-1"]');
    this.chaletRate = this.chalet4.locator('[data-rate-row]').filter({ hasText: '497 EUR' }).getByRole('button', { name: 'Increase quantity' });
    this.confirmPage = page.locator('#confirm-page-content');
    this.confirmRoom = page.locator('#confirm-sidebar-room-name');
    this.confirmPricing = page.locator('#confirm-sidebar-pricing');
    this.guestForm = page.locator('#confirm-booking-form');
    this.success = page.locator('#confirm-success-column');
    this.selection = page.locator('#selection-sidebar-panel');
    this.reserve = page.locator('#reserve-now-btn');
    this.firstName = page.getByLabel('First Name');
    this.lastName = page.getByLabel('Last Name');
    this.email = page.getByLabel('Email Address');
    this.terms = page.getByRole('checkbox', { name: /I agree to the Terms of Service and Privacy Policy/ });
    this.confirm = page.getByRole('button', { name: 'Confirm Booking', exact: true });
    this.resultTitle = page.locator('#confirm-success-title');
    this.reference = page.getByText('Booking reference: CAB-1042');
    this.unavailable = page.getByText('Not available for selected dates');
  }

  async open() {
    await this.page.goto('/');
    await this.page.getByRole('heading', { name: 'Cabana', level: 1 }).waitFor();
  }

  async showDate(iso) {
    const day = () => this.page.locator(`#date-range-calendars [data-date="${iso}"]`);
    for (let step = 0; step < 18; step += 1) {
      if (await day().count()) return day();
      await this.page.locator('#date-range-calendars [data-nav="1"]').first().click();
    }
    throw new Error(`Could not find ${iso} in the calendar`);
  }

  async pickDate(iso) {
    const day = await this.showDate(iso);
    await day.dispatchEvent('pointerup');
  }

  async searchStay() {
    await this.page.locator('#booking-check-in-trigger').click();
    await this.page.locator('#date-range-apply').waitFor();
    await this.pickDate('2026-08-04');
    await this.pickDate('2026-08-05');
    await this.page.locator('#date-range-apply').click();
    await this.search.click();
    await this.chaletRate.waitFor();
  }

  async fillGuest() {
    await this.firstName.fill('Ana');
    await this.lastName.fill('Pop');
    await this.email.fill('ana.pop@example.com');
    await this.terms.check();
  }
}
