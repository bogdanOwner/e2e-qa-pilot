# Book Chalet 4 at Cabana

```gherkin
Feature: Book Chalet 4 at Cabana

  Scenario: Book Chalet 4 at Cabana
    Given the guest is on the Cabana page
    When the guest sets check-in to 4 Aug 2026 and check-out to 5 Aug 2026 and clicks Search
    Then Chalet 4 is listed at 497 EUR, with 15% off and free cancellation
    And Chalet 1 is not available for the selected dates
    When the guest presses Increase quantity on the Chalet 4 rate priced at 497 EUR and clicks Reserve Now
    Then the selection shows Chalet 4 and a total of 497 EUR
    And the guest form opens on the confirm page
    When the guest enters First Name "Ana", Last Name "Pop", and Email Address "ana.pop@example.com", accepts the terms, and clicks Confirm Booking
    Then the confirmation says "Your request was successfully sent."
    And booking reference CAB-1042 is shown
```
