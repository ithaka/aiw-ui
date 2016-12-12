Feature: Keyword search
As a researcher, I want to be able to perform a simple keyword(s) search, SO THAT I can find images related to that keyword.

Background:
Given I am a registered Artstor user
And I go to library.artstor.org
And I log in as a Sample University user

Scenario: User searches for “painting” in all collections
When I search for “paris”
Then I should get multiple results


Feature: Sort Search Results
As a researcher, I want to be able to sort search results, SO THAT I can find what I am looking for.

Background:
Given I am a registered Artstor user
And I go to library.artstor.org
And I log in as a Sample University user

Scenario: User searches for a keyword and sorts their results
    When I search for record(s) matching "<phrase>"
    And I order my results by <sort_order>
    Then I should get multiple results
    And the results should be sorted by <sort_order>
    Examples:
      | phrase   | sort_order |
      | paris | Relevance  |
      | paris | Title      |
      | paris | Creator    |
      | paris | Date       |


Feature: Filter Search Results
As an Artstor user, I want to be able to filter search results by collection type, SO THAT I can narrow my results in interesting ways.

Background:
Given I am a registered Artstor user
And I go to library.artstor.org
And I log in as a Sample University user

Scenario: User searches for a keyword and filters by classification
    When I search for record(s) matching "<phrase>"
    And I apply a classification filter of "<classification_name>"
    Then I should get multiple results
    Examples:
      | phrase   | classification_name                                     |
      | paris | Drawings and Watercolors                                |
      | paris | Painting                                                |
      | paris | Prints                                                  |
      | paris | Photographs                                             |
      | paris | Decorative Arts, Utilitarian Objects and Interior Design|


  Scenario: User searches for a keyword and filters by location
    When I search for record(s) matching "<phrase>"
    And I apply a location filter of "<location_name>"
    Then I should get multiple results
    Examples:
      | phrase        | location_name      |
      | Stained Glass | North America            |
      | Stained Glass | France |
      | Stained Glass | Germany           |

  Scenario: User searches for a keyword and filters by a date range
    When I search for record(s) matching "<phrase>"
    And I apply a date filter starting with <start_year> and ending with <end_year>
    Then I should get multiple results
    Examples:
      | phrase        | start_year | end_year |
      | paris      | 1700       | 1800     |
      | Stained Glass | 1280       | 1395    |
