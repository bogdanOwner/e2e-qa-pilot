# Cabana

One page for Cabana, plus a confirm page at `/booking`. Search reads the rooms from `data/customer.json` on the page. The guest books Chalet 4 for 4 Aug 2026 to 5 Aug 2026. Confirm Booking does not call the network. After the required fields are filled, it waits about 2 seconds, then shows the success page.

| Step | Action | Page contract | Screenshot |
|------|--------|---------------|------------|
| 1 | Set check-in to 4 Aug 2026 and check-out to 5 Aug 2026, then click Search. | [pages/cabin.md](../pages/cabin.md) | [stay-dates.png](../screenshots/png/stay-dates.png), [chalet-4-rate.png](../screenshots/png/chalet-4-rate.png), [chalet-1-unavailable.png](../screenshots/png/chalet-1-unavailable.png) |
| 2 | Press Increase quantity on the Chalet 4 rate priced at 497 EUR, then click Reserve Now. | [pages/cabin.md](../pages/cabin.md) | [chalet-4-selection.png](../screenshots/png/chalet-4-selection.png), [guest-form.png](../screenshots/png/guest-form.png) |
| 3 | Enter First Name "Ana", Last Name "Pop", and Email Address "ana.pop@example.com", accept the terms, and click Confirm Booking. | [pages/cabin.md](../pages/cabin.md) | [guest-details.png](../screenshots/png/guest-details.png), [booking-sent.png](../screenshots/png/booking-sent.png) |

There is no Figma column. The steps are the oracle.
