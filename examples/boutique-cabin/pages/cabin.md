# Cabin page

## Expected behavior

1. Chalet 4 is listed at 497 EUR, with 15% off and free cancellation. Chalet 1 is not available for the selected dates.
2. The selection shows Chalet 4 and a total of 497 EUR, and the guest form opens on the confirm page.
3. The confirmation says "Your request was successfully sent." and booking reference CAB-1042 is shown.

## Elements

- Check-in and check-out: `#booking-check-in-trigger`, `#booking-check-out-trigger`. The applied values are `#booking-check-in` and `#booking-check-out`.
- Search: `#availability-search-btn`.
- Chalet 4 card: `[data-room-card]` filtered by Chalet 4. The 497 EUR rate uses the Increase quantity button.
- Chalet 1 card: `[data-room-card]` filtered by Chalet 1.
- Selection: `#selection-sidebar-panel`. Reserve Now: `#reserve-now-btn`.
- Confirm page: `#confirm-page-content`. Room name: `#confirm-sidebar-room-name`. Total column: `#confirm-summary-column`.
- Guest fields: First Name, Last Name, Email Address. Terms checkbox: "I agree to the Terms of Service and Privacy Policy". Confirm Booking button.
- Confirmation: `#confirm-success-title` and the booking reference text.

## Reference

Captured from the running app.

- `screenshots/png/stay-dates.png`
- `screenshots/png/chalet-4-rate.png`
- `screenshots/png/chalet-1-unavailable.png`
- `screenshots/png/chalet-4-selection.png`
- `screenshots/png/guest-form.png`
- `screenshots/png/guest-details.png`
- `screenshots/png/booking-sent.png`

## Visible copy

- Availability
- CHECK-IN
- 08/04/2026
- CHECK-OUT
- 08/05/2026
- GUESTS
- 2 adults · 0 children · 1 room
- SEARCH
- 1 night stay
- Chalet 4
- 497 EUR
- 15% off
- Free cancellation (per rate plan)
- Increase quantity
- Chalet 1
- Not available for selected dates
- Your Selection
- Chalet 4 · 1 × 497 EUR
- Total
- 497 EUR
- RESERVE NOW
- Complete Your Booking
- Guest Information
- First Name
- Last Name
- Email Address (optional)
- Your booking confirmation will be sent to this email
- I agree to the Terms of Service and Privacy Policy.
- Confirm Booking
- Your stay
- Total Price
- Your request was successfully sent.
- Our manager will contact you shortly to confirm your stay.
- Booking reference: CAB-1042
- Back to home

## Test data

| Field | Value | Source |
|-------|-------|--------|
| Check-in | 4 Aug 2026 | case |
| Check-out | 5 Aug 2026 | case |
| First Name | Ana | case |
| Last Name | Pop | case |
| Email Address | ana.pop@example.com | case |

## States

### Stay dates

Step 1, before Search. The fields show check-in 08/04/2026 and check-out 08/05/2026, which are 4 Aug 2026 and 5 Aug 2026. Screenshot: `screenshots/png/stay-dates.png`.

### Availability

Step 1, after Search. The Chalet 4 card lists 497 EUR with 15% off and free cancellation. Screenshot: `screenshots/png/chalet-4-rate.png`. The Chalet 1 card reads "Not available for selected dates". Screenshot: `screenshots/png/chalet-1-unavailable.png`.

### Selection

Step 2, before Reserve Now. The selection shows Chalet 4 and a total of 497 EUR. Screenshot: `screenshots/png/chalet-4-selection.png`.

### Guest form

Step 2, after Reserve Now. The confirm page is open, the summary shows Chalet 4 and 497 EUR, and the guest form is visible. Screenshot: `screenshots/png/guest-form.png`.

### Guest details

Step 3, before Confirm Booking. First Name is Ana, Last Name is Pop, Email Address is ana.pop@example.com, and the terms checkbox is checked. Screenshot: `screenshots/png/guest-details.png`.

### Booking sent

Step 3, after Confirm Booking. The heading is "Your request was successfully sent." and the page shows "Booking reference: CAB-1042". Screenshot: `screenshots/png/booking-sent.png`.
