# Cabin page

## Expected behavior

Chalet 4 is listed at 497 EUR, with 15% off and free cancellation. Chalet 1 is not available for the selected dates.

## Elements

- Check-in: `#booking-check-in-trigger`
- Check-out: `#booking-check-out-trigger`
- Apply: `#date-range-apply`
- Search: `#availability-search-btn`
- Room list: `#availability-room-list`
- Chalet 4: `[data-room-card="chalet-4"]`
- Chalet 4 rate at 497 EUR: `[data-rate-row="chalet-4:chalet-4-0"]`
- Increase quantity: button "Increase quantity" on that rate
- Chalet 1: `[data-room-card="chalet-1"]`
- Reserve Now opens the confirm page: `pages/confirm.md`

## Reference

Captured from the running app. `screenshots/png/availability-results.png`

## Visible copy

- Cabana
- Check-in
- Check-out
- Guests
- Apply
- Search
- Chalet 4
- 497 EUR
- 15% off
- Free cancellation (per rate plan)
- Not available for selected dates
- Increase quantity
- Reserve Now

## States

### Availability results

Case step 1. After Search, the room list shows Chalet 4 at 497 EUR, with 15% off and free cancellation. Chalet 1 reads `Not available for selected dates`.

Screenshot: `screenshots/png/availability-results.png`
