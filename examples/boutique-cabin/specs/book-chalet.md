# Book Chalet 4

```gherkin
Feature: Cabana booking

  Scenario: Reserve Chalet 4 for one night
    Given the guest is on the Cabana page
    When the guest searches 4 Aug 2026 to 5 Aug 2026
    Then Chalet 4 is listed at 497 EUR
    When the guest increases the quantity for that rate and clicks Reserve Now
    Then the selection shows Chalet 4 and 497 EUR
    And the confirm page opens
    When the guest confirms the stay
    Then the screen heading is "Your request was successfully sent."
    And a booking reference is shown
```
