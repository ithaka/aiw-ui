Feature: Log in through Shibboleth
As a Artstor user, I want to be able to create an Artstor account through my institution, SO THAT I don't have to remember a separate Artstor login.

Background:
Given I belong to an Artstor-subscribing institution 
My institution is Shibboleth-enabled
And I go to library.artstor.org

Scenario: User wants to log in with Shibboleth for the first time and does not have an Artstor account
When I select my institution from the dropdown
And click login
Then I am redirected to my school’s login page
When I login successfully
Then I am redirect back to the Artstor login page 
And I select to create a new account
Then I fill out the registration fields
Then I am redirected to the library page and logged in 


Scenario: User wants to log in with Shibboleth for the first time and already has an Artstor account
When I select my institution from the dropdown
And click login
Then I am redirected to my school’s login page
When I login successfully
Then I am redirect back to the Artstor login page 
And I select to use my existing Artstor account
Then I fill out my login and password
Given that my account is from the same institution I selected initially
And my account is not already linked
Then I am redirected to the library page and logged in 

Scenario: User tried to relink a linked account
When I select my institution from the dropdown
And click login
Then I am redirected to my school’s login page
When I login successfully
Then I am redirect back to the Artstor login page 
And I select to use my existing Artstor account
Then I fill out my login and password
Given that my account is already linked to a shibboleth ID
Then I get an error that states this account is already linked 

Scenario: User wants to log in with Shibboleth for the first time and already has an Artstor account from another institution
When I select my institution from the dropdown
And click login
Then I am redirected to my school’s login page
When I login successfully
Then I am redirect back to the Artstor login page 
And I select to use my existing Artstor account
Then I fill out my login and password
Given that my account is from another institution
Then I get an error that states this account is from a different institution

Scenario: User wants to log in with Shibboleth for the first time and already has an Artstor account but doesn’t know their password
When I select my institution from the dropdown
And click login
Then I am redirected to my school’s login page
When I login successfully
Then I am redirect back to the Artstor login page 
And I select to use my existing Artstor account
Then I fill out my login and password
Given that my password is incorrect
Then I get an error that states the password is in correct
Then I can click “Forgot password?” to retrieve it

Scenario: User wants to log in with Shibboleth and their account is already linked
When I select my institution from the dropdown
And click login
Then I am redirected to my school’s login page
When I login successfully
Then I am redirected to the library page and logged in 
