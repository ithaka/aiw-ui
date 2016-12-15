Feature: Browse ADL by Classification 
As a student, I want to be able to browse the Artstor Digital Library (ADL) by classification, SO THAT I can find images related to a genre I am studying.

Background:
Given I belong to an Artstor-subscribing institution 
And I am on campus
And I go to library.artstor.org

Scenario: User wants to see all Maps in ADL
When I go to the Browse page
And I chose to Browse ADL by Classification
Then I should see a list of Classification and the counts of how many images are in each category
Then I select “Prints”
Then I should see a thumbnail page with images of Prints from ADL

Feature: Browse ADL by Geography 
As a student, I want to be able to browse the Artstor Digital Library by geography, SO THAT I can find images related to country or region I am studying.

Background:
Given I belong to an Artstor-subscribing institution 
And I am on campus
And I go to library.artstor.org

Scenario: User wants to see all images from Albania in ADL
When I go to the Browse page
And I chose to Browse ADL by Geograpgy
Then I should see a list of countries and the counts of how many images are in each category
Then I select “Albania”
Then I should see a thumbnail page with images from Albania from ADL


Feature: Browse ADL by Collection
As a researcher, I want to be able to browse the collections in Artstor, SO THAT I can find out which ones are relevant to my research.

Background:
Given I belong to an Artstor-subscribing institution 
And I am on campus
And I go to library.artstor.org

Scenario: User wants to see the American Museum of Natural History Collection in ADL
When I go to the Browse page
And I chose to Browse ADL by Collection
Then I should see a list of collections and the counts of how many images are in each category
Then I click to see more information about the American Museum of Natural History Collection
Then I select the collection name
Then I should see a thumbnail page with images from the collection

Feature: Browse by Institutional Collection
As an instructor, I want to be able to view all my institution’s collections, SO THAT I can find images from our teaching collection to prepare for class.

Background:
Given I am a registered Artstor user
And I go to library.artstor.org
And I log in as a Sample University user

Scenario: User wants to the archives collection from their institution
When I go to the Browse page
And I chose to browse by Sample U collections
Then I should see a list of collections from my institution
Then I click to see more information about the Sample University Archives Collection
Then I select the collection name
Then I should see a thumbnail page with images from the collection


Feature: Browse by Private Collection
As an instructor, I want to be able to view all my private collections, SO THAT I can find my images to prepare for class.

Background:
Given I am a registered Artstor user
And I go to library.artstor.org
And I log in as a Sample University user (qasam001@artstor.org)

Scenario: User wants to their private collections
When I go to the Browse page
And I chose to browse by my collections
Then I should see a list of my collections 
Then I click to see more information about the Sample Private Collection
Then I select the collection name
Then I should see a thumbnail page with images from the collection


Feature: Browse ADL by Teaching Resources
As an instructor, I want to be able to view collections by theme, SO THAT I can find images from our teaching collection to prepare for class.

Background:
Given I belong to an Artstor-subscribing institution 
And I am on campus
And I go to library.artstor.org

Scenario: User wants to see all Prehistoric Art in ADL
When I go to the Browse page
And I chose to Browse ADL by Teaching Resources
Then I should see a list of Themes
Then I select “Art and Architecture Overviews” and then “Art and Architecture, Periods and Cultures”
Then I click to see more information about “Prehistoric Art”
Then I select the theme
Then I should see a thumbnail page with images of prehistoric art from ADL



Feature: Browse by Image Groups
As a student, I want to be able to browse image groups to find the ones my instructor made for my course, SO THAT I can study for an exam.

Background:
Given I am a registered Artstor user
And I go to library.artstor.org
And I log in as a Sample University user

Scenario: User wants to open a group about Esto her professor made
When I go to the Browse page
And I chose to Browse by Groups
And I chose to see Institution Groups
Then I should see a list of folders
Then I select to expand “Architecture” 
Then I should see a group called “Esto”
Then I select the group
Then I should see a thumbnail page with images from Esto
