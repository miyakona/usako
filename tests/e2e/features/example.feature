Feature: Example

  Scenario: Sending a GET request to the root
    When I send a GET request to "/"
    Then the response status should be 200 