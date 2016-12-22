Feature: Download Single Image 
As a student, I want to be able to download a single image, SO THAT I can insert it in a paper.

Background:
Given I belong to an Artstor-subscribing institution 
And I am on campus
And I go to library.artstor.org

Scenario: Not Logged-in User wants to download an image
When I search for “french cafe” and open the first image
And I click the download button
Then I get an error that says I must log in to download
Then I click OK
And the message closes

Scenario: Logged-in User wants to download an image
When I log in
And I search for “french cafe” and open the first image
And I click the download button
Then I click that I agree to the terms and conditions of use
Then the image downloads through my browser


Feature: Download Document
As a student, I want to be able to download a document (pdf, ppt, doc, excel), SO THAT I can read it. 

Background:
Given I belong to an Artstor-subscribing institution 
And I am on campus
And I go to library.artstor.org

Scenario: Logged-in User wants to download a document
When I log in
And I search for program.pdf and open the first result
And I click the download button
Then I click that I agree to the terms and conditions of use
Then the document downloads through my browser


Feature: Download Video Thumbnail
As a student, I want to be able to download a video still, SO THAT I can insert it in a paper.

Scenario: Logged-in User wants to download a video still
When I log in
And I search for Lunda 8 and open the first result
And I click the download button
Then I click that I agree to the terms and conditions of use
Then the image downloads through my browser


Feature: Download Image Group
As a student, I want to be able to export a group as a zip file, SO THAT I can use the images in a presentation format of my choosing.

Background:
Given I belong to an Artstor-subscribing institution 
And I am on campus
And I go to library.artstor.org

Scenario: Logged-in User wants to download an image group
When I log in
And I open an image group http://library.artstor.org/library/#3%7Cimagegroup%7C837464%7C%7CUnlocked20Folders203E20Teaching20Resources203E20Curriculum20Guides203E20The20Coffeehouse2026gt3B2030312E20A20Whole20New20World2028313229%7Cfldr_729678%7Ctrue%7C
And I click the download button
Then I get a message that there is a download limit and that multimedia files are not included in download
And I click OK
Then the download begins
And the zip file is downloaded through my browser


Scenario: I have met my download limit
When I log in
And I open an image group http://library.artstor.org/library/#3%7Cimagegroup%7C837464%7C%7CUnlocked20Folders203E20Teaching20Resources203E20Curriculum20Guides203E20The20Coffeehouse2026gt3B2030312E20A20Whole20New20World2028313229%7Cfldr_729678%7Ctrue%7C
And I click the download button
Then I get a message that I have met my download limit
And I click OK and the file is not downloaded


Feature: Export Group to PowerPoint
As an instructor, I want to be able to export a group to PPT, SO THAT I present it in class.

Background:
Given I belong to an Artstor-subscribing institution 
And I am on campus
And I go to library.artstor.org

Scenario: Logged-in User wants to export an image group to PPT
When I log in
And I open an image group http://library.artstor.org/library/#3%7Cimagegroup%7C837464%7C%7CUnlocked20Folders203E20Teaching20Resources203E20Curriculum20Guides203E20The20Coffeehouse2026gt3B2030312E20A20Whole20New20World2028313229%7Cfldr_729678%7Ctrue%7C
And I click the export to PPT button
Then I get a message that there is a download limit and that multimedia files are not included in download
And I click OK
Then the download begins
And the PPT file is downloaded through my browser


Scenario: I have met my download limit
When I log in
And I open an image group http://library.artstor.org/library/#3%7Cimagegroup%7C837464%7C%7CUnlocked20Folders203E20Teaching20Resources203E20Curriculum20Guides203E20The20Coffeehouse2026gt3B2030312E20A20Whole20New20World2028313229%7Cfldr_729678%7Ctrue%7C
And I click the export button
Then I get a message that I have met my download limit
And I click OK and the file is not downloaded









