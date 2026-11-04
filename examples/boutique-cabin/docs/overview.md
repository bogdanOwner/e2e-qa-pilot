# Cabana

One page for Cabana, plus a confirm page at `/booking`. Search reads the rooms from `data/customer.json` on the page. Increasing the quantity on Chalet 4 at 497 EUR and confirming the stay shows `Your request was successfully sent.` and a booking reference. Confirm Booking does not call the network. After the required fields are filled, it waits about 2 seconds, then shows the success page.

| Step | Action | Page contract | Screenshot |
|------|--------|---------------|------------|
| 1 | Set check-in to 4 Aug 2026 and check-out to 5 Aug 2026, then click Search. | pages/cabin.md | screenshots/png/chalet-4-rate.png, screenshots/png/chalet-1-unavailable.png |
| 2 | Press Increase quantity on the Chalet 4 rate priced at 497 EUR, then click Reserve Now. | pages/cabin.md | screenshots/png/chalet-4-selection.png, screenshots/png/guest-form.png |
| 3 | Enter First Name "Ana", Last Name "Pop", and Email Address "ana.pop@example.com", accept the terms, and click Confirm Booking. | pages/cabin.md | screenshots/png/guest-form-filled.png, screenshots/png/booking-sent.png |

Known defect (deliberate, used by `cases/mismatch.md`): in the Guests picker a chosen child age is not saved, so the red "Select age" label stays after Done and the picker does not close.
