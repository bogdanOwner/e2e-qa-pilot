export class CabinPage {
  constructor(page) {
    this.page = page;
    this.search = page.locator('#availability-search-btn');
    this.searchSection = page.locator('#booking-search-section');
    this.checkIn = page.locator('#booking-check-in');
    this.checkOut = page.locator('#booking-check-out');
    this.chalet4 = page.locator('[data-room-card]').filter({ hasText: 'Chalet 4' });
    this.chalet1 = page.locator('[data-room-card]').filter({ hasText: 'Chalet 1' });
    this.chaletRate = this.chalet4.locator('[data-rate-row]').filter({ hasText: '497 EUR' }).getByRole('button', { name: 'Increase quantity' });
    this.roomList = page.locator('#availability-room-list');
    this.selection = page.locator('#selection-sidebar-panel');
    this.selectionTotal = page.locator('#selection-total');
    this.reserve = page.locator('#reserve-now-btn');
    this.confirmPage = page.locator('#confirm-page-content');
    this.confirmRoom = page.locator('#confirm-sidebar-room-name');
    this.confirmSummary = page.locator('#confirm-summary-column');
    this.firstName = page.getByLabel('First Name');
    this.lastName = page.getByLabel('Last Name');
    this.email = page.getByLabel('Email Address');
    this.terms = page.getByRole('checkbox', { name: /I agree to the Terms of Service and Privacy Policy/ });
    this.confirm = page.getByRole('button', { name: 'Confirm Booking', exact: true });
    this.resultTitle = page.locator('#confirm-success-title');
    this.success = page.locator('#confirm-success-column');
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

  async chooseStay(checkIn, checkOut) {
    await this.page.locator('#booking-check-in-trigger').click();
    await this.page.locator('#date-range-apply').waitFor();
    await this.pickDate(checkIn);
    await this.pickDate(checkOut);
    await this.page.locator('#date-range-apply').click();
    await this.page.locator('#date-range-apply').waitFor({ state: 'hidden' });
  }

  async searchStay(checkIn = '2026-08-04', checkOut = '2026-08-05') {
    await this.chooseStay(checkIn, checkOut);
    await this.search.click();
    await this.chaletRate.waitFor();
  }

  async fillGuest(guest) {
    await this.firstName.fill(guest.firstName);
    await this.lastName.fill(guest.lastName);
    await this.email.fill(guest.email);
    await this.terms.check();
  }
}
