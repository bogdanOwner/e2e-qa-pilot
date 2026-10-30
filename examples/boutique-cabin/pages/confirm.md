# Confirm page

## Expected behavior

The selection shows Chalet 4 and a total of 497 EUR, and the guest form opens on the confirm page.

The confirmation says "Your request was successfully sent." and booking reference CAB-1042 is shown.

## Elements

- Confirm page: `/booking`, `#confirm-page-content`
- Guest form: `#confirm-booking-form`
- First Name: `#confirm-first-name`
- Last Name: `#confirm-last-name`
- Email Address: `#confirm-email`
- Terms: `#confirm-terms`
- Confirm Booking: `#confirm-submit-btn`
- Room: `#confirm-sidebar-room-name`
- Total: `#confirm-sidebar-pricing`
- Success: `#confirm-success-column`
- Heading: `#confirm-success-title`
- Booking reference: `#confirm-success-ref`

## Reference

Captured from the running app. `screenshots/png/booking-confirm.png` and `screenshots/png/booking-sent.png`

## Visible copy

- Complete Your Booking
- Guest Information
- First Name
- Last Name
- Email Address
- Your booking confirmation will be sent to this email
- I agree to the Terms of Service and Privacy Policy
- Confirm Booking
- Your stay
- Chalet 4
- Tue, Aug 4, 2026
- Wed, Aug 5, 2026
- Total Price
- 497 EUR
- Your request was successfully sent.
- Our manager will contact you shortly to confirm your stay.
- Booking reference: CAB-1042
- Back to home

## States

### Guest form

Case step 2. The confirm page is open. The summary shows Chalet 4 and a total of 497 EUR. First Name, Last Name, and Email Address are on the guest form.

Screenshot: `screenshots/png/booking-confirm.png`

### Booking sent

Case step 3. The heading reads `Your request was successfully sent.` and the page shows `Booking reference: CAB-1042`.

Screenshot: `screenshots/png/booking-sent.png`
