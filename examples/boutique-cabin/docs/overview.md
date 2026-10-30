# Cabana

One page for Cabana, plus a confirm page at `/booking`. Search reads the rooms from `data/customer.json` on the page. Increasing the quantity on Chalet 4 at 497 EUR and confirming the stay shows `Your request was successfully sent.` and a booking reference. Confirm Booking does not call the network. After the required fields are filled, it waits about 2 seconds, then shows the success page.

Steps are the oracle.

| Step | Action | Page contract | Screenshot |
|------|--------|---------------|------------|
| 1 | Set check-in to 4 Aug 2026 and check-out to 5 Aug 2026, then click Search. | pages/cabin.md | screenshots/png/availability-results.png |
| 2 | Press Increase quantity on the Chalet 4 rate priced at 497 EUR, then click Reserve Now. | pages/confirm.md | screenshots/png/booking-confirm.png |
| 3 | Enter First Name, Last Name, and Email Address, accept the terms, and click Confirm Booking. | pages/confirm.md | screenshots/png/booking-sent.png |
