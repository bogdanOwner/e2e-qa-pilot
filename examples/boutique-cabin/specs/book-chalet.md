# Book Chalet 4

```gherkin
Feature: Cabana 365 booking

  Scenario: Reserve Chalet 4 for one night
    Given the guest is on the Cabana 365 page
    When the guest searches 4 Aug 2026 to 5 Aug 2026
    Then Chalet 4 is listed at 497 RON
    When the guest selects that rate and confirms the stay
    Then the screen heading is "Your request was successfully sent."
    And a booking reference is shown
    And the selection shows Chalet 4, 4 Aug 2026 – 5 Aug 2026, and 497 RON
```
