# Cabin page

## States

- Cabana 365 shows the hotel name, the English about text, facilities, reviews, and the gallery.
- Availability has Check-in, Check-out, Guests, and Search. After search, each rate has a quantity stepper. Chalet 4 lists 497 EUR with 15% off and free cancellation. Chalet 1 reads `Not available for selected dates`.
- Your Selection shows the chosen room and the total. Reserve Now opens `/booking`.
- The confirm page has First Name, Last Name, Email Address, Phone Number, the terms checkbox, and Confirm Booking. Confirm Booking does not send a request. After a short wait the heading reads `Your request was successfully sent.` and the page shows `Booking reference: CAB-1042`.
- The Booking timeout demo link opens `/?demo=timeout`. That flag stays on the confirm URL. Confirm Booking then shows `Something went wrong. Please try again.` and no booking reference.

PNG names match [overview.md](../docs/overview.md): `cabin-home.png`, `availability-results.png`, `booking-sent.png`.
