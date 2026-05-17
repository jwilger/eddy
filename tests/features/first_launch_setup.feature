Feature: Show first-launch setup

  Scenario: No setup exists yet
    Given no saved setup exists
    When Eddy starts in the terminal
    Then Eddy shows the first-launch setup screen

  Scenario: Saved OpenAI access no longer verifies
    Given saved OpenAI access no longer verifies
    When Eddy starts in the terminal
    Then Eddy shows the first-launch setup screen because saved OpenAI access could not be verified

  Scenario: Valid setup already exists
    Given saved OpenAI access verifies successfully
    When Eddy starts in the terminal
    Then Eddy continues to the learner's current app location
