const app = document.querySelector('#app');
const demoTimeout = new URLSearchParams(location.search).get('demo') === 'timeout';
const clientTimeoutMs = 8000;

const [customer, copy, amenities] = await Promise.all([
  fetch('/data/customer.json').then((response) => response.json()),
  fetch('/data/locales/en.json').then((response) => response.json()),
  fetch('/data/locales/roomAmenities.json').then((response) => response.json()),
]);

const label = (key) => copy[key];
const concepts = Object.values(amenities.concepts ?? {});

function amenityLabel(raw) {
  const value = String(raw ?? '').trim();
  const match = concepts.find((concept) => concept.en && concept.en.toLowerCase() === value.toLowerCase());
  return match ? match.en : value;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function money(amount, currency) {
  return `${amount} ${currency}`;
}

function nightsBetween(checkIn, checkOut) {
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  return Math.round((end - start) / 86400000);
}

function formatDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const booking = customer.booking;
const about = customer.about?.description ?? '';
const facilities = customer.about?.topFacilities ?? [];
const reviews = customer.testimonials ?? [];
const gallery = (customer.gallery ?? []).slice(0, 5);
const directLine = customer.heroLocales?.en?.boutique_hero_direct_line ?? '';

document.title = customer.hotelName;
app.innerHTML = `
  <section class="wrap hero">
    <img class="hero-photo" alt="" src="${escapeHtml(gallery[0] ?? '')}" />
    <div>
      <p class="kicker">${escapeHtml(directLine)}</p>
      <h1>${escapeHtml(customer.hotelName)}</h1>
      <p>${escapeHtml(customer.tagline)}</p>
      <p class="score">${escapeHtml(booking.scoreLabel)} ${escapeHtml(booking.overallScore)} · ${escapeHtml(booking.reviewCount)} reviews</p>
      <p class="muted">From ${escapeHtml(customer.priceFrom)}</p>
      <p class="muted">Check-in from ${escapeHtml(customer.checkInTime)} · Check-out until ${escapeHtml(customer.checkOutTime)}</p>
      <p class="muted">${escapeHtml(customer.address)}</p>
    </div>
  </section>
  <section class="wrap">
    <h2>About this property</h2>
    ${about.split('\n').filter(Boolean).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
    <div class="chips">${facilities.map((item) => `<span class="chip">${escapeHtml(item.label)}</span>`).join('')}</div>
  </section>
  <section class="wrap" aria-label="Gallery">
    <h2>Gallery</h2>
    <div class="gallery">${gallery.map((url) => `<img alt="" src="${escapeHtml(url)}" />`).join('')}</div>
  </section>
  <section class="wrap" aria-label="Reviews">
    <h2>Reviews</h2>
    ${reviews.map((review) => `<article><h3>${escapeHtml(review.name)}</h3><p>${escapeHtml(review.text)}</p><p class="muted">${escapeHtml(review.country)}</p></article>`).join('')}
  </section>
  <section class="wrap" id="booking">
    <h2>${escapeHtml(label('boutique_availability_title'))}</h2>
    <form class="search" id="search-form">
      <label>${escapeHtml(label('boutique_booking_check_in'))}
        <input id="check-in" name="checkIn" type="date" required />
      </label>
      <label>${escapeHtml(label('boutique_booking_check_out'))}
        <input id="check-out" name="checkOut" type="date" required />
      </label>
      <label>${escapeHtml(label('boutique_booking_guests'))}
        <input id="guests" name="guests" type="number" min="1" value="2" required />
      </label>
      <button id="search" type="submit">${escapeHtml(label('boutique_availability_search'))}</button>
    </form>
    <p id="demo-note" class="muted"></p>
    <p id="search-status" class="muted" role="status"></p>
    <div class="layout">
      <div id="room-list" class="rooms" aria-live="polite"></div>
      <aside id="selection" class="selection" aria-label="${escapeHtml(label('boutique_availability_your_selection'))}">
        <h3>${escapeHtml(label('boutique_availability_your_selection'))}</h3>
        <p id="selection-empty" class="muted">Select a room to continue.</p>
        <div id="selection-body" class="hidden"></div>
        <form id="guest-form" class="guest hidden">
          <h3>${escapeHtml(label('boutique_confirm_guest_info'))}</h3>
          <label>${escapeHtml(label('boutique_confirm_first_name'))}
            <input id="first-name" name="firstName" type="text" required />
          </label>
          <label>${escapeHtml(label('boutique_confirm_last_name'))}
            <input id="last-name" name="lastName" type="text" required />
          </label>
          <label>${escapeHtml(label('boutique_confirm_email'))}
            <input id="email" name="email" type="email" required />
          </label>
          <label>${escapeHtml(label('boutique_confirm_phone'))}
            <input id="phone" name="phone" type="tel" required />
          </label>
          <label class="agree">
            <input id="terms" name="terms" type="checkbox" required />
            <span>${escapeHtml(label('boutique_booking_legal_agree_prefix'))}${escapeHtml(label('legal_terms_of_service'))}${escapeHtml(label('boutique_booking_legal_and'))}${escapeHtml(label('legal_privacy_policy'))}${escapeHtml(label('boutique_booking_legal_agree_suffix'))}</span>
          </label>
          <button id="confirm" type="submit">${escapeHtml(label('boutique_confirm_btn'))}</button>
        </form>
        <div id="result" class="result hidden"></div>
      </aside>
    </div>
  </section>
  <footer class="wrap">${escapeHtml(customer.hotelName)} · ${escapeHtml(customer.address)}</footer>
`;

const searchForm = document.querySelector('#search-form');
const demoNote = document.querySelector('#demo-note');
const searchStatus = document.querySelector('#search-status');
const roomList = document.querySelector('#room-list');
const selectionEmpty = document.querySelector('#selection-empty');
const selectionBody = document.querySelector('#selection-body');
const guestForm = document.querySelector('#guest-form');
const result = document.querySelector('#result');
const confirmButton = document.querySelector('#confirm');

let stay = null;
let selected = null;
let rooms = [];
let searchController = null;
let bookingController = null;
let bookingToken = 0;

if (demoTimeout) {
  demoNote.textContent = 'Booking timeout demo. Confirm booking shows an error instead of a reference.';
} else {
  demoNote.innerHTML = '<a href="/?demo=timeout">Booking timeout demo</a>';
}

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(searchForm);
  const checkIn = String(data.get('checkIn'));
  const checkOut = String(data.get('checkOut'));
  const nightCount = nightsBetween(checkIn, checkOut);
  if (nightCount < 1) {
    searchStatus.textContent = 'Check-out must be after check-in.';
    return;
  }
  searchController?.abort();
  bookingController?.abort();
  bookingToken += 1;
  const controller = new AbortController();
  searchController = controller;
  stay = { checkIn, checkOut, nights: nightCount, guests: Number(data.get('guests')) };
  selected = null;
  showSelection();
  searchStatus.textContent = label('boutique_availability_loading');
  roomList.replaceChildren();
  try {
    const response = await fetch('/api/availability', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(stay),
    });
    if (controller.signal.aborted) return;
    const payload = await response.json();
    if (controller.signal.aborted) return;
    rooms = payload.rooms ?? [];
    searchStatus.textContent = '';
    renderRooms(rooms);
  } catch (error) {
    if (error.name === 'AbortError' || controller.signal.aborted) return;
    searchStatus.textContent = label('boutique_booking_error');
  }
});

function renderRooms(list) {
  roomList.innerHTML = list.map((room) => {
    const photo = room.photos?.[0] ?? '';
    const amenityText = (room.amenities ?? []).slice(0, 6).map(amenityLabel).join(' · ');
    const rates = room.unavailable || !room.rates?.length
      ? `<p>${escapeHtml(room.unavailableMessage || label('boutique_availability_unavailable'))}</p>`
      : room.rates.map((rate) => `
          <div class="rate">
            <div>
              <strong>${rate.discount ? `<span class="was">${escapeHtml(money(rate.originalPrice, rate.currency))}</span>` : ''}${escapeHtml(money(rate.price, rate.currency))}</strong>
              <div class="muted">${escapeHtml([rate.priceNotes, rate.discount].filter(Boolean).join(' · '))}</div>
            </div>
            <button type="button" data-room-id="${escapeHtml(room.id)}" data-rate-id="${escapeHtml(rate.id)}">Select ${escapeHtml(room.name)}, ${escapeHtml(money(rate.price, rate.currency))}</button>
          </div>
        `).join('');
    return `
      <article class="room">
        <img alt="" src="${escapeHtml(photo)}" />
        <div>
          <h3>${escapeHtml(room.name)}</h3>
          <p class="muted">${escapeHtml(room.sizeM2 ?? '')} m² · up to ${escapeHtml(room.maxGuests ?? '')} guests</p>
          <p>${escapeHtml(room.description ?? '')}</p>
          <p class="muted">${escapeHtml(amenityText)}</p>
          ${rates}
        </div>
      </article>
    `;
  }).join('');
}

roomList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-rate-id]');
  if (!button || !stay) return;
  const room = rooms.find((item) => item.id === button.dataset.roomId);
  const rate = room?.rates?.find((item) => item.id === button.dataset.rateId);
  if (!room || !rate) return;
  selected = { room, rate };
  for (const other of roomList.querySelectorAll('button[data-rate-id]')) {
    other.setAttribute('aria-pressed', other === button ? 'true' : 'false');
  }
  showSelection();
});

function showSelection() {
  result.classList.add('hidden');
  result.replaceChildren();
  if (!selected || !stay) {
    selectionEmpty.classList.remove('hidden');
    selectionBody.classList.add('hidden');
    guestForm.classList.add('hidden');
    return;
  }
  const total = selected.rate.price * stay.nights;
  const nightLabel = stay.nights === 1 ? '1 night' : `${stay.nights} nights`;
  selectionEmpty.classList.add('hidden');
  selectionBody.classList.remove('hidden');
  guestForm.classList.remove('hidden');
  selectionBody.innerHTML = `
    <p>${escapeHtml(label('boutique_confirm_you_selected'))} <strong>${escapeHtml(selected.room.name)}</strong></p>
    <p>${escapeHtml(formatDate(stay.checkIn))} – ${escapeHtml(formatDate(stay.checkOut))} · ${escapeHtml(nightLabel)}</p>
    <p>${escapeHtml(label('boutique_availability_total'))}: <strong>${escapeHtml(money(total, selected.rate.currency))}</strong></p>
  `;
}

guestForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!selected || !stay) return;
  const data = new FormData(guestForm);
  const token = ++bookingToken;
  bookingController?.abort();
  const controller = new AbortController();
  bookingController = controller;
  confirmButton.disabled = true;
  confirmButton.textContent = label('boutique_booking_processing');
  const timer = setTimeout(() => controller.abort(), clientTimeoutMs);
  const current = () => token === bookingToken && bookingController === controller;
  try {
    const response = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        demo: demoTimeout ? 'timeout' : undefined,
        roomId: selected.room.id,
        rateId: selected.rate.id,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        firstName: data.get('firstName'),
        lastName: data.get('lastName'),
        email: data.get('email'),
        phone: data.get('phone'),
      }),
    });
    if (!current()) return;
    if (!response.ok) throw new Error('booking failed');
    const payload = await response.json();
    if (!current()) return;
    result.className = 'result';
    result.innerHTML = `<h2>${escapeHtml(payload.title)}</h2><p>${escapeHtml(payload.body)}</p><p>${escapeHtml(payload.referenceLine)}</p>`;
    guestForm.classList.add('hidden');
  } catch {
    if (!current()) return;
    result.className = 'result error';
    result.innerHTML = `<h2>${escapeHtml(label('boutique_booking_error'))}</h2>`;
  } finally {
    clearTimeout(timer);
    if (!current()) return;
    confirmButton.disabled = false;
    confirmButton.textContent = label('boutique_confirm_btn');
  }
});
