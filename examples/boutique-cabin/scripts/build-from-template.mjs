import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const exampleRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generatorRoot = path.resolve(exampleRoot, '../../../hotel-site-generator');
const customerPath = path.join(exampleRoot, 'data/customer.json');

const about = [
  'Essential Facilities: Cabana in Les Houches offers a sun terrace, garden, and free WiFi in public areas. Private check-in and check-out services ensure a smooth arrival and departure.',
  'Comfortable Accommodations: Rooms feature air-conditioning, balconies, and kitchenettes. Additional amenities include private bathrooms, fireplaces, and mountain views. Family rooms and ground-floor units cater to all guests.',
  'Dining Options: A continental breakfast with local specialities, warm dishes, and cheese is served daily. The on-site coffee shop and barbecue facilities provide additional dining options.',
  'Nearby Attractions: The cabins sit above the Chamonix valley, a short walk from the glaciers above Les Houches. Geneva Airport is about 90 km away.',
].join('\n\n');

const mockReviews = [
  {
    name: 'Alex M.',
    country: 'France',
    text: 'Quiet cabin, a clear mountain view, and an easy check-in. We would stay again.',
    rating: 5,
  },
  {
    name: 'Jamie L.',
    country: 'Germany',
    text: 'The room was warm, the terrace faced the valley, and breakfast was simple and good.',
    rating: 5,
  },
  {
    name: 'Sam R.',
    country: 'Italy',
    text: 'A calm place to unwind. The walk to the glacier path took about ten minutes.',
    rating: 4,
  },
];

const localPhotoNames = [
  'exterior_01.jpg',
  'exterior_05.jpg',
  'exterior_03.jpg',
  'exterior_04.jpg',
  'exterior_08.jpg',
  'exterior_02.jpg',
  'interior_03.jpg',
  'interior_02.jpg',
  'interior_04.jpg',
  'interior_01.jpg',
  'interior_05.jpg',
  'exterior_06.jpg',
  'exterior_09.jpg',
  'interior_06.jpg',
  'exterior_07.jpg',
];

const tracked = [
  'data/customer.json',
  'templates/boutique-cabin/confirmBooking.ts',
  'templates/boutique-cabin/bookingForm.ts',
  'templates/boutique-cabin/availabilitySearch.ts',
  'templates/boutique-cabin/Booking.astro',
  'templates/boutique-cabin/BookingConfirmPage.astro',
  'templates/boutique-cabin/phoneCountries.ts',
  'data/locales/en.json',
  'data/locales/ro.json',
  'data/locales/de.json',
];

function replaceOnce(file, from, to, label) {
  const source = fs.readFileSync(file, 'utf8');
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`${label} matched ${count} times in ${file}`);
  fs.writeFileSync(file, source.replace(from, to));
}

function localCabinPhotos() {
  return localPhotoNames
    .filter((name) => fs.existsSync(path.join(exampleRoot, 'gallery', name)))
    .map((name) => `/gallery/${name}`);
}

function prepareCustomer() {
  const customer = JSON.parse(fs.readFileSync(customerPath, 'utf8'));
  customer.hotelName = 'Cabana';
  customer.phone = '+33 4 50 00 00 00';
  customer.whatsapp = '+33 4 50 00 00 00';
  customer.email = 'stay@example.com';
  customer.bookingUrl = '';
  customer.agencyWhatsapp = '';
  customer.agencyEmail = '';
  customer.defaultLocale = 'en';
  customer.isDemoMode = false;
  customer.address = '18 Chemin des Glaciers, 74310 Les Houches, France';
  customer.googleMapsUrl = 'https://www.google.com/maps?q=45.8904,6.7984&hl=en';
  customer.googleMapsEmbed = 'https://maps.google.com/maps?q=45.8904,6.7984&output=embed';
  customer.priceFrom = '497 EUR';
  customer.socialLinks = {
    ...(customer.socialLinks || {}),
    facebook: '',
    instagram: '',
    google: customer.googleMapsUrl,
  };
  customer.stats = [
    { value: '4.6', label: 'Google Rating' },
    { value: '24', label: 'Google Reviews' },
  ];
  for (const locale of Object.values(customer.heroLocales || {})) {
    if (locale && typeof locale === 'object') locale.boutique_hero_title = 'Cabana';
  }
  if (customer.about) {
    customer.about.description = about;
    customer.about.couplesScore = 9.4;
    customer.about.descriptionI18n = { ...(customer.about.descriptionI18n || {}), ro: about };
  }
  if (customer.booking) {
    customer.booking.bookingUrl = '';
    customer.booking.overallScore = '9.2';
    customer.booking.reviewCount = '24';
    customer.booking.scoreLabel = 'Wonderful';
    customer.booking.categoryScores = {
      cleanliness: '9.2',
      comfort: '9.1',
      location: '9.4',
      staff: '9.0',
      value: '9.1',
      facilities: '9.0',
      wifi: '9.0',
    };
  }
  customer.testimonials = mockReviews;
  customer.testimonialsI18n = { ro: mockReviews };

  const photos = localCabinPhotos();
  if (photos.length) {
    customer.gallery = photos;
    for (const [index, room] of (customer.booking?.rooms || []).entries()) {
      if (!Array.isArray(room.photos) || !room.photos.length) continue;
      const alreadyLocal = room.photos.every((photo) => typeof photo === 'string' && photo.startsWith('/gallery/'));
      if (alreadyLocal) continue;
      const start = index % photos.length;
      room.photos = room.photos.map((_, photoIndex) => photos[(start + photoIndex) % photos.length]);
    }
  }

  const walk = (node) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!node || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
      if ((key === 'currency' || key === 'breakfastCurrency') && value === 'RON') node[key] = 'EUR';
      else walk(value);
    }
  };
  walk(customer);
  fs.writeFileSync(customerPath, `${JSON.stringify(customer, null, 2)}\n`);
}

function patchTemplate() {
  const confirm = path.join(generatorRoot, 'templates/boutique-cabin/confirmBooking.ts');
  const booking = path.join(generatorRoot, 'templates/boutique-cabin/bookingForm.ts');
  const search = path.join(generatorRoot, 'templates/boutique-cabin/availabilitySearch.ts');

  replaceOnce(
    confirm,
    "import { getTurnstileToken, resolveBookingEndpoint } from './bookingEndpoint';\n",
    '',
    'confirm import',
  );
  replaceOnce(
    confirm,
    `    const turnstileToken = getTurnstileToken();
    if (!turnstileToken) {
      showSubmitError(clientT('boutique_booking_error'));
      return;
    }`,
    "    const turnstileToken = '';",
    'confirm turnstile',
  );
  replaceOnce(
    confirm,
    `    try {
      const resp = await fetch(resolveBookingEndpoint(config.bookingEndpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const raw = await resp.text();
      let data: { ok?: boolean; error?: string; bookingRef?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(
          resp.ok
            ? clientT('boutique_booking_error')
            : \`Booking service error (\${resp.status}). Check booking.firmizo.com routing.\`,
        );
      }
      if (!resp.ok || !data.ok) throw new Error(data.error || clientT('boutique_booking_error'));

      const reference = data.bookingRef || '';
      clearPersistedSelections();
      showSuccess(sendEmailConfirmation, email, reference);
    } catch (err) {
      const message = err instanceof Error ? err.message : clientT('boutique_booking_error');
      showSubmitError(message);
      if (submitBtn) {
        submitBtn.textContent = btnConfirm;
        submitBtn.disabled = false;
      }
      if (mobileBtn) {
        mobileBtn.textContent = btnConfirm;
        mobileBtn.disabled = false;
      }
      updateSubmitState();
    }`,
    `    void payload;
    void turnstileToken;
    const demo = new URLSearchParams(location.search).get('demo');
    await new Promise((resolve) => window.setTimeout(resolve, 2000));
    if (demo === 'timeout') {
      showSubmitError(clientT('boutique_booking_error'));
      if (submitBtn) {
        submitBtn.textContent = btnConfirm;
        submitBtn.disabled = false;
      }
      if (mobileBtn) {
        mobileBtn.textContent = btnConfirm;
        mobileBtn.disabled = false;
      }
      updateSubmitState();
      return;
    }

    clearPersistedSelections();
    showSuccess(sendEmailConfirmation, email, 'CAB-1042');`,
    'confirm submit',
  );

  replaceOnce(
    booking,
    "import { getTurnstileToken, resolveBookingEndpoint } from './bookingEndpoint';\n",
    "import { getTurnstileToken } from './bookingEndpoint';\n",
    'booking import',
  );
  replaceOnce(
    booking,
    `    try {
      const resp = await fetch(resolveBookingEndpoint(bookingEndpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.ok) throw new Error(data.error || 'Request failed');

      submitBtn.textContent = btnConfirmed;
      submitBtn.classList.add('booking-submit--ready');
      openSuccessModal();
    } catch {`,
    `    try {
      void payload;
      void bookingEndpoint;
      await new Promise((resolve) => window.setTimeout(resolve, 2000));
      submitBtn.textContent = btnConfirmed;
      submitBtn.classList.add('booking-submit--ready');
      openSuccessModal();
    } catch {`,
    'booking submit',
  );

  replaceOnce(
    search,
    `  if (photo) params.set('photo', photo);

  persistSelections(checkIn, checkOut, selections);`,
    `  if (photo) params.set('photo', photo);

  const demo = new URLSearchParams(window.location.search).get('demo');
  if (demo) params.set('demo', demo);

  persistSelections(checkIn, checkOut, selections);`,
    'demo query',
  );
  replaceOnce(
    search,
    '<p class="room-card__unavailable-msg">${escapeHtml(cfg.lblNotAvailable)}</p>',
    '<p class="room-card__unavailable-msg">${escapeHtml(cfg.lblUnavailable)}</p>',
    'unavailable copy',
  );
  for (const file of [search, confirm]) {
    const source = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, source.replaceAll("|| 'RON'", "|| 'EUR'"));
  }
  const bookingPage = path.join(generatorRoot, 'templates/boutique-cabin/Booking.astro');
  replaceOnce(bookingPage, '>0 RON<', '>0 EUR<', 'total placeholder');
  replaceOnce(
    bookingPage,
    `{t('boutique_booking_phone')} <span class="text-[#717973]">*</span>`,
    `{t('boutique_booking_phone')}`,
    'home phone asterisk',
  );
  replaceOnce(
    bookingPage,
    '<input id="booking-phone" name="guestPhone" type="tel" required autocomplete="tel"',
    '<input id="booking-phone" name="guestPhone" type="tel" autocomplete="tel"',
    'home phone required',
  );

  const confirmPage = path.join(generatorRoot, 'templates/boutique-cabin/BookingConfirmPage.astro');
  replaceOnce(
    confirmPage,
    `                    <span data-i18n="boutique_confirm_phone">{t('boutique_confirm_phone')}</span>
                    <span class="confirm-required" aria-hidden="true"> *</span>`,
    `                    <span data-i18n="boutique_confirm_phone">{t('boutique_confirm_phone')}</span>`,
    'confirm phone asterisk',
  );

  replaceOnce(
    path.join(generatorRoot, 'templates/boutique-cabin/phoneCountries.ts'),
    "export const DEFAULT_PHONE_COUNTRY: CountryCode = 'RO';",
    "export const DEFAULT_PHONE_COUNTRY: CountryCode = 'FR';",
    'default phone country',
  );

  replaceOnce(
    confirm,
    "const REQUIRED_FIELD_IDS = ['confirm-first-name', 'confirm-last-name', 'confirm-phone'];",
    "const REQUIRED_FIELD_IDS = ['confirm-first-name', 'confirm-last-name'];",
    'required fields',
  );
  replaceOnce(
    confirm,
    `  if (!national) {
    showPhoneFieldError(clientT('boutique_confirm_field_required'));
    return false;
  }`,
    '  if (!national) return true;',
    'empty phone',
  );
  replaceOnce(
    confirm,
    `  const phone = getPhoneNational();
  if (!isValidGuestPhone(getPhoneCountryCode(), phone)) return false;`,
    `  const phone = getPhoneNational();
  if (phone && !isValidGuestPhone(getPhoneCountryCode(), phone)) return false;`,
    'optional phone submit check',
  );
  replaceOnce(
    confirm,
    `    if (id === 'confirm-phone') {
      if (!validatePhoneField()) valid = false;
      continue;
    }
    clearFieldError(el);`,
    '    clearFieldError(el);',
    'validate loop',
  );
  replaceOnce(
    confirm,
    `  }

  const emailEl = document.getElementById('confirm-email');`,
    `  }

  if (!validatePhoneField()) valid = false;

  const emailEl = document.getElementById('confirm-email');`,
    'validate filled phone',
  );
  replaceOnce(
    confirm,
    '        else showPhoneFieldError(clientT(\'boutique_confirm_field_required\'));',
    '        else clearPhoneFieldError();',
    'phone blur',
  );
  replaceOnce(
    confirm,
    `    const phone = formatGuestPhoneE164(phoneCountryIso, phoneRaw);
    if (!phone) {`,
    `    const phone = phoneRaw ? formatGuestPhoneE164(phoneCountryIso, phoneRaw) : '';
    if (phoneRaw && !phone) {`,
    'empty phone payload',
  );

  replaceOnce(
    booking,
    `    const name = document.getElementById('booking-name') as HTMLInputElement | null;
    const phone = document.getElementById('booking-phone') as HTMLInputElement | null;
    const email = document.getElementById('booking-email') as HTMLInputElement | null;

    if (!checkInInput?.value || !checkOutInput?.value) return false;
    if (checkOutInput.value <= checkInInput.value) return false;
    if (!name?.value.trim() || !phone?.value.trim()) return false;`,
    `    const name = document.getElementById('booking-name') as HTMLInputElement | null;
    const email = document.getElementById('booking-email') as HTMLInputElement | null;

    if (!checkInInput?.value || !checkOutInput?.value) return false;
    if (checkOutInput.value <= checkInInput.value) return false;
    if (!name?.value.trim()) return false;`,
    'home can submit',
  );
  replaceOnce(
    booking,
    `    const name = document.getElementById('booking-name') as HTMLInputElement | null;
    const phone = document.getElementById('booking-phone') as HTMLInputElement | null;
    const email = document.getElementById('booking-email') as HTMLInputElement | null;
    if (!name?.value.trim() || !phone?.value.trim()) return false;`,
    `    const name = document.getElementById('booking-name') as HTMLInputElement | null;
    const email = document.getElementById('booking-email') as HTMLInputElement | null;
    if (!name?.value.trim()) return false;`,
    'home validate',
  );

  const exampleCopy = {
    footer_rights: 'Example site for e2e-qa-pilot. Mock data only.',
    activate_top_headline: 'Example site for e2e-qa-pilot. Mock data only.',
    activate_top_subline: '',
    activate_top_headline_mobile_1: 'Example site for e2e-qa-pilot.',
    activate_top_headline_mobile_2: 'Mock data only.',
    activate_top_subline_mobile: '',
    activate_banner_line1: 'Mock rooms and prices',
    activate_banner_line2: 'No real booking request',
    activate_banner_line3: 'Use this site to try e2e-qa-pilot.',
    popup_heading: 'Mock data only',
    popup_sub: 'This example does not send a booking request. Use it to try e2e-qa-pilot.',
    activate_btn_label: 'Try e2e-qa-pilot',
    activate_btn_sub: 'Example site with mock data',
    agency_whatsapp_prefill: '',
    agency_email_subject: 'e2e-qa-pilot example',
    agency_email_body: 'This is an example site with mock data. It does not send a booking request.',
  };
  for (const localeName of ['en.json', 'ro.json', 'de.json']) {
    const localeFile = path.join(generatorRoot, 'data/locales', localeName);
    const locale = JSON.parse(fs.readFileSync(localeFile, 'utf8'));
    Object.assign(locale, exampleCopy);
    fs.writeFileSync(localeFile, `${JSON.stringify(locale, null, 2)}\n`);
  }
}

function pruneUnreferencedAstro() {
  const astroDir = path.join(exampleRoot, '_astro');
  if (!fs.existsSync(astroDir)) return;
  const referenced = new Set();
  const visitHtml = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'html' || entry.name === '_astro') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visitHtml(full);
      else if (entry.name.endsWith('.html')) {
        const text = fs.readFileSync(full, 'utf8');
        for (const match of text.matchAll(/\/_astro\/([A-Za-z0-9_.-]+)/g)) referenced.add(match[1]);
      }
    }
  };
  visitHtml(exampleRoot);
  const pending = [...referenced];
  while (pending.length) {
    const name = pending.pop();
    const file = path.join(astroDir, name);
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(/["']\.\/([A-Za-z0-9_.-]+)["']/g)) {
      if (!referenced.has(match[1])) {
        referenced.add(match[1]);
        pending.push(match[1]);
      }
    }
  }
  for (const entry of fs.readdirSync(astroDir)) {
    if (!referenced.has(entry)) fs.rmSync(path.join(astroDir, entry));
  }
}

function copyDist() {
  const dist = path.join(generatorRoot, 'dist');
  const skip = new Set([
    'data',
    'tests',
    'cases',
    'docs',
    'specs',
    'pages',
    'html',
    'scripts',
    'server.mjs',
    'package.json',
    'package-lock.json',
    'README.md',
    'playwright.config.mjs',
    'playwright.live.config.mjs',
    'playwright.mismatch.config.mjs',
    'playwright.shared.mjs',
    'build-html.mjs',
    'run-playwright.mjs',
    'app.js',
    'styles.css',
    'gallery',
  ]);

  const copyInto = (fromDir, toDir) => {
    for (const entry of fs.readdirSync(fromDir, { withFileTypes: true })) {
      if (fromDir === dist && skip.has(entry.name)) continue;
      const from = path.join(fromDir, entry.name);
      const to = path.join(toDir, entry.name);
      if (entry.isDirectory()) {
        fs.mkdirSync(to, { recursive: true });
        copyInto(from, to);
      } else {
        fs.copyFileSync(from, to);
      }
    }
  };
  const astroDir = path.join(exampleRoot, '_astro');
  if (fs.existsSync(astroDir)) fs.rmSync(astroDir, { recursive: true, force: true });
  copyInto(dist, exampleRoot);
  pruneUnreferencedAstro();
  for (const name of ['app.js', 'styles.css']) {
    const file = path.join(exampleRoot, name);
    if (fs.existsSync(file)) fs.rmSync(file);
  }
}

if (!fs.existsSync(path.join(generatorRoot, 'package.json'))) {
  console.error(`hotel-site-generator not found at ${generatorRoot}`);
  process.exit(1);
}

prepareCustomer();

const backupDir = fs.mkdtempSync(path.join(os.tmpdir(), 'boutique-cabin-build-'));
for (const relative of tracked) {
  const from = path.join(generatorRoot, relative);
  const to = path.join(backupDir, relative);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

let failed = false;
try {
  fs.copyFileSync(customerPath, path.join(generatorRoot, 'data/customer.json'));
  patchTemplate();
  const build = spawnSync('npm', ['run', 'build'], {
    cwd: generatorRoot,
    stdio: 'inherit',
    env: process.env,
  });
  if (build.status !== 0) throw new Error(`astro build exited ${build.status}`);
  copyDist();
} catch (error) {
  failed = true;
  console.error(error);
} finally {
  for (const relative of tracked) {
    fs.copyFileSync(path.join(backupDir, relative), path.join(generatorRoot, relative));
  }
  fs.rmSync(backupDir, { recursive: true, force: true });
}

if (failed) process.exit(1);
