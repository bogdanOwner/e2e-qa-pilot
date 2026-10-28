export class CabinPage {
  constructor(page) {
    this.page = page;
    this.checkIn = page.getByLabel('Check-in');
    this.checkOut = page.getByLabel('Check-out');
    this.guests = page.getByLabel('Guests');
    this.search = page.getByRole('button', { name: 'Search' });
    this.chalet4 = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Chalet 4', level: 3 }) });
    this.chaletRate = page.getByRole('button', { name: 'Select Chalet 4, 497 RON' });
    this.selection = page.getByRole('complementary', { name: 'Your Selection' });
    this.firstName = page.getByLabel('First Name');
    this.lastName = page.getByLabel('Last Name');
    this.email = page.getByLabel('Email Address');
    this.phone = page.getByLabel('Phone Number');
    this.terms = page.getByRole('checkbox', { name: 'I agree to the Terms of Service and Privacy Policy.' });
    this.confirm = page.getByRole('button', { name: 'Confirm Booking' });
    this.resultTitle = page.locator('#result h2');
    this.reference = page.getByText('Booking reference: CAB-1042');
    this.unavailable = page.getByText('Not available for selected dates');
  }

  async open({ timeout = false } = {}) {
    await this.page.goto(timeout ? '/?demo=timeout' : '/');
    await this.page.getByRole('heading', { name: 'Cabana 365', level: 1 }).waitFor();
  }
}
