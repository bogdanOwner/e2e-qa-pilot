# Cabin page

## Expected behavior

1. The Guests picker closes, the guests summary shows 1 child, and no "Select age" error is visible.
2. Chalet 4 is listed at 497 EUR, with 15% off and free cancellation.
3. The selection shows Chalet 4 and a total of 497 EUR, and the guest form opens on the confirm page.

## Elements

- Guests trigger: button "Guests" (`#guests-trigger`)
- Guests picker: dialog "Guests" (`#guests-panel`)
- Children increase: `#guests-panel [data-guest-step="children"][data-dir="1"]`
- Children count: `#guests-children-count`
- Child age: `#child-ages-list select`
- Select age error: `#child-ages-error`
- Done: button "Done" (`#guests-done`)
- Guests summary: `#guests-summary`
- Check-in: `#booking-check-in-trigger`
- Search: `#availability-search-btn`
- Chalet 4 card: `[data-room-card]` filtered by "Chalet 4"
- Increase quantity on the 497 EUR rate, inside that card
- Your Selection: `#selection-sidebar-panel`
- Reserve Now: `#reserve-now-btn`
- First Name on the confirm page

## Reference

Captured from the running app.

- `screenshots/png/guests-select-age.png`

## Visible copy

- Cabana
- Guests
- Adults
- Children
- Rooms
- Done
- Select age
- To find suitable accommodation with correct pricing, please enter each child's age at check-out.
- 2 adults · 1 child · 1 room

## Test data

| Field | Value | Source |
|-------|-------|--------|
| Children | 1 | case |
| Child age | 5 | case |

## States

### Guests picker after Done

The Guests picker is still open. Children is 1, the age select shows 5, and the red "Select age" label is visible. Case step 1. Screenshot: `screenshots/png/guests-select-age.png`.
