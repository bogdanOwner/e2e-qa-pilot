# Cabana

One page for Cabana, plus a confirm page at `/booking`. Search reads the rooms from `data/customer.json` on the page. Increasing the quantity on Chalet 4 at 497 EUR and confirming the stay shows `Your request was successfully sent.` and a booking reference. Confirm Booking does not call the network. After the required fields are filled, it waits about 2 seconds, then shows the success page.

| Step | Action | Page contract | Screenshot |
|------|--------|---------------|------------|
| 1 | Open the Guests picker, increase Children to 1, choose age 5 for the child, and click Done. | pages/cabin.md | screenshots/png/guests-select-age.png |
| 2 | Set check-in to 4 Aug 2026 and check-out to 5 Aug 2026, then click Search. | pages/cabin.md | — |
| 3 | Press Increase quantity on the Chalet 4 rate priced at 497 EUR, then click Reserve Now. | pages/cabin.md | — |

Known defect (deliberate, used by `cases/mismatch.md`): in the Guests picker a chosen child age is not saved, so the red "Select age" label stays after Done and the picker does not close.
