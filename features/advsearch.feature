Feature: Advanced search
As an Artstor user, I want to be able to define my search parameters, SO THAT I can narrow my results precisely.

Background:
Given I am a registered Artstor user
And I go to library.artstor.org
And I log in as a Sample University user

Scenario: User searches for term in specific field
When I open the advanced search modal   
I type the search tern  “paris”
And I select the “Title” field
And I click Search
Then I should get multiple results

Scenario: User searches for a keyword and classification
When I open the advanced search modal   
I type the search tern  "<phrase>"
And I add a classification filter of "<classification_name>"
And I click Search
Then I should get multiple results
    Examples:
      | phrase   | classification_name                                     |
      | paris | Drawings and Watercolors                                |
      | paris | Painting                                                |
      | paris | Prints                                                  |
      | paris | Photographs                                             |
      | paris | Decorative Arts, Utilitarian Objects and Interior Design|


  Scenario: User searches for a keyword and a date range
When I open the advanced search modal  
And I type the keyword "<phrase>"
And I apply a date filter starting with <start_year> and ending with <end_year>
And I click Search
Then I should get multiple results
    Examples:
      | phrase        | start_year | end_year |
      | paris      | 1700       | 1800     |
      | Stained Glass | 1280       | 1395    |


  Scenario: User searches for a keyword and location
    When I open the advanced search modal  
    And I type the keyword "<phrase>"
    And I apply a location filter of "<location_name>"
And I click Search
    Then I should get multiple results
    Examples:
      | phrase        | location_name      |
      | Stained Glass | Mexico             |
      | Stained Glass | Sub-Sarahan Africa |
      | Stained Glass | Hungary            |


  Scenario Outline: User searches for a keyword and applies multiple filters
    When I open the advanced search modal  
    And I type the keyword "<phrase>"
    And I apply a classification filter of "<classification_name>"
    And I apply a location filter of "<location_name>"
    And I apply a date filter starting with <start_year> and ending with <end_year>
And I click Search
    Then I should get multiple results
    Examples:
      | phrase        | classification_name | location_name | start_year | end_year |
      | painting      | Prints              | United States | 1941       | 1958     |
      | Stained Glass | Photographs         | Mexico        | 1941       | 1958     |


  Scenario: User searches without a keyword
    When  I apply a location filter of "<location_name>"
    And I do not enter a search term
And I click Search
    Then I should get an error: “Enter a search term”

  Scenario: User searches without a keyword
    When I open the advanced search modal  
    And I search for record(s) matching "<phrase>"    
When  I apply a location filter of "<location_name>"
    And I click “Clear”
    Then all fields should be cleared
