# Cabana

One page for Cabana, plus a confirm page at `/booking`. Search reads the rooms from `data/customer.json` on the page. Increasing the quantity on Chalet 4 at 497 EUR and confirming the stay shows `Your request was successfully sent.` and a booking reference. Confirm Booking does not call the network. After the required fields are filled, it waits about 2 seconds, then shows the success page.

| Screen state | PNG name |
|--------------|----------|
| Cabana | cabin-home.png |
| Availability | availability-results.png |
| Booking sent | booking-sent.png |
