# Book Chalet 4 for a guest with a child

```gherkin
Feature: Cabana booking

  Scenario: Book Chalet 4 for a guest with a child
    Given the guest is on the Cabana page
    When the guest opens the Guests picker, increases Children to 1, chooses age 5 for the child, and clicks Done
    Then the Guests picker closes
    And the guests summary shows 1 child
    And no "Select age" error is visible
    When the guest sets check-in to 4 Aug 2026 and check-out to 5 Aug 2026 and clicks Search
    Then Chalet 4 is listed at 497 EUR, with 15% off and free cancellation
    When the guest presses Increase quantity on the Chalet 4 rate priced at 497 EUR and clicks Reserve Now
    Then the selection shows Chalet 4 and a total of 497 EUR
    And the guest form opens on the confirm page
```
