Feature: Open Asset Page with Image Viewer 
As a researcher, I want to be able to open an image in an image viewer, SO THAT I can examine the details of the image.

Background:
Given I belong to an Artstor-subscribing institution 
And I am on campus
And I go to library.artstor.org

Scenario: User wants to zoom in on an image
When I open an asset page for an image
And I click to zoom in on the image
Then the zoom level increased
And I can do that until it get to 100%

Scenario: User wants to reset zoom
When I have zoomed in on an image
Then I can click the reset button
And the image goes back to the original zoom level

Scenario: User wants to pan
When i have zoomed in on and an image
Then I can click and drag on the image to see different parts


Feature: Page Through Search Results
As a researcher, I want to be able to move through the search results from the image viewer, SO THAT I see relevant images in a large view.

Background: 
Given I belong to an Artstor-subscribing institution 
And I am on campus
And I go to library.artstor.org

Scenario: User wants to page through search results
When I search for “french cafe”
And I open the first result
Then I can click to view the next result
And the next page opens
And I can click to view the previous result


Feature: Play Audio and Video
As a researcher, I want to be able to play audio/video files with basic manipulation controls, SO THAT I can hear or view multimedia content relevant to my research.

Background:
Given I belong to an Artstor-subscribing institution 
And I am on campus
And I go to library.artstor.org

Scenario: User wants to view a video
When I search for “Lunda 8”
And I open the asset page
Then the page opens with the video player embedded
Then I can click to play and pause the video

Feature: View Full Metadata
As a researcher, I want to be able to view all of the item record's metadata, SO THAT I can find out more information about the item.

Background:
Given I belong to an Artstor-subscribing institution 
And I am on campus
And I go to library.artstor.org

Scenario: User wants to view the full metadata of an image
When I search for 13040003 
And I click to view the asset page
Then all the metadata fields appear alongside the image, including: Creator, Title, Work Type, Date, Material, Measurements, Description, Repository, Accession Number, Related Item, Collection, and Source
