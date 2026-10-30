# Cabana

One page for Cabana, plus a confirm page at `/booking`. Search reads the rooms from `data/customer.json` on the page. Increasing the quantity on Chalet 4 at 497 EUR and confirming the stay shows `Your request was successfully sent.` and a booking reference. Confirm Booking does not call the network. Opening `/?demo=timeout` keeps that flag on the confirm URL. Confirm then shows `Something went wrong. Please try again.` and no reference.

| Screen state | PNG name |
|--------------|----------|
| Cabana | cabin-home.png |
| Availability | availability-results.png |
| Booking sent | booking-sent.png |
