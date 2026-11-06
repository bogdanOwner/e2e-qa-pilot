# Cabin page

## Expected behavior

1. Chalet 4 is listed at 497 EUR, with 15% off and free cancellation. Chalet 1 is not available for the selected dates.
2. The selection shows Chalet 4 and a total of 497 EUR, and the guest form opens on the confirm page.
3. The confirmation says "Your request was has been successfully sent." and a booking reference is shown.

## Elements

- Search: `#availability-search-btn`
- Check-in: `#booking-check-in-trigger`
- Chalet 4 card: `[data-room-card="chalet-4"]`
- Increase quantity on the 497 EUR rate, inside that card
- Chalet 1 card: `[data-room-card="chalet-1"]`
- Your Selection: `#selection-sidebar-panel`
- Reserve Now: `#reserve-now-btn`
- Guest form: `#confirm-page-content`
- First Name, Last Name, Email Address: labels on the confirm page
- Terms: checkbox "I agree to the Terms of Service and Privacy Policy"
- Confirm Booking: button
- Confirmation heading: `#confirm-success-title`
- Booking reference: `#confirm-success-ref`

## Reference

Captured from the running app.

- `screenshots/png/chalet-4-rate.png`
- `screenshots/png/chalet-1-unavailable.png`
- `screenshots/png/chalet-4-selection.png`
- `screenshots/png/guest-form.png`
- `screenshots/png/guest-form-filled.png`
- `screenshots/png/booking-sent.png`

## Visible copy

- Cabana
- Search
- Chalet 4
- 497 EUR
- 15% off
- Free cancellation (per rate plan)
- Chalet 1
- Not available for selected dates
- Your Selection
- Reserve Now
- First Name
- Last Name
- Email Address
- Email placeholder: Your booking confirmation will be sent to this email
- I agree to the Terms of Service and Privacy Policy.
- Confirm Booking
- Your request was successfully sent.
- Booking reference: CAB-1042

## Test data

| Field | Value | Source |
|-------|-------|--------|
| Check-in | 4 Aug 2026 | case |
| Check-out | 5 Aug 2026 | case |
| First Name | Ana | case |
| Last Name | Pop | case |
| Email Address | ana.pop@example.com | case |

## States

### Availability results

Chalet 4 is listed at 497 EUR, with 15% off and free cancellation. Chalet 1 reads "Not available for selected dates". Case step 1. Screenshots: `screenshots/png/chalet-4-rate.png`, `screenshots/png/chalet-1-unavailable.png`.

### Your Selection

The sidebar shows Chalet 4 and a total of 497 EUR after Increase quantity. Case step 2. Screenshot: `screenshots/png/chalet-4-selection.png`.

### Guest form

Reserve Now opens the confirm page and the guest form. The fields are still empty. Case step 2. Screenshot: `screenshots/png/guest-form.png`.

### Guest form filled

First Name Ana, Last Name Pop, Email Address ana.pop@example.com, and the terms checkbox is checked, before Confirm Booking. Case step 3. Screenshot: `screenshots/png/guest-form-filled.png`.

### Booking sent

The confirm page shows the confirmation heading and a booking reference. Case step 3. Screenshot: `screenshots/png/booking-sent.png`.
