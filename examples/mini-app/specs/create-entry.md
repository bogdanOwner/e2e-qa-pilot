# Create an Awesome diary entry

```gherkin
Feature: Mood diary

  Scenario: Save an Awesome entry
    Given the user is signed in and on the Personal Space page
    When the user clicks the Awesome mood emoji
    Then the Create Diary Entry modal opens with Awesome preselected
    When the user enters thoughts and clicks Save
    Then the screen toast is "Your Diary entry successfully created!"
    And the modal closes
    And the new entry appears in the Mood Diary preview
    And a chart dot appears
```
