Feature: Remote Login with Artstor Account
As a registered Artstor user, I want to be able to access Artstor even though I am not at my institution currently. 

Background:
Given I am a registered Artstor user
And I go to library.artstor.org
And I am not IP-authorized

Scenario: I know my password and remote access period is valid
When I enter my email address and password
And all the details are correct 
And I submit the form 
Then the main library search page should display 
And I will be logged in

Scenario: I mistype my email address or password
When I enter my email address and password
And the details are incorrect
And I submit the form 
Then I should see an error

Scenario: I forgot my password 
When I select “Forgot your password”
Then I should get a dialog to input my email
And when I enter my email 
And I submit the form
Then the system will reset my password
And send me an email with the new password

Scenario: My remote access period is expired
When I enter my email address and password
And all the details are correct 
And I submit the form 
Then I should see an error 


Feature: Remote Login Through Institution
As a Artstor user, I want to be able to access Artstor even though I am not at my institution currently and I have not previously registered for an Artstor account. 

Background:
Given I belong to an Artstor-subscribing institution
And I go to library.artstor.org
And I am not IP-authorized
And I do not have an Artstor account
And I have logged in through my institution before

Scenario: My school has a proxy link
When I select my school’s name from the dropdown
And I submit the form 
Then I am redirected to my school’s login page
And when I enter my email and password
And all the details are correct
And I submit the form
Then the main library search page should display 
And I will not be logged in

Scenario: My school has Shibboleth and I have logged in with it before
When I select my school’s name from the dropdown
And I submit the form 
Then I am redirected to my school’s login page
And when I enter my email and password
And all the details are correct
And I submit the form
Then the main library search page should display 
And I will be logged in

Feature: Login with Shibboleth and Create New Account
As a Artstor user, I want to be able to access Artstor even though I am not at my institution currently. My school provides single sign-on but I have never registered for an Artstor account. 

Background:
Given I belong to an Artstor-subscribing institution
And I go to library.artstor.org
And I am not IP-authorized
And I do not have an Artstor account

Scenario: My school has Shibboleth and I do not have an Artstor account
When I select my school’s name from the dropdown
And I submit the form 
Then I am asked if I have an account or if I have to create a new one
And when I select “create a new account”
Then I am shown a registration form
And I enter my email, role, and department
And I submit the form
Then the main library search page should display 
And I will be logged in

Feature: Link Artstor and Institution Accounts
As a Artstor user, I want to be able to access Artstor even though I am not at my institution currently. My school provides single sign-on but I have also previously registered for an Artstor account. 

Background:
Given I belong to an Artstor-subscribing institution
And I go to library.artstor.org
And I am not IP-authorized
And I have an Artstor account

Scenario: My school has Shibboleth and I have an Artstor account
When I select my school’s name from the dropdown
And I submit the form 
Then I am asked if I have an account or if I have to create a new one
And when I select “I have an account”
Then I am shown a login form
And I enter my email and password
And all the details are correct
And I submit the form
Then the main library search page should display 
And I will be logged in

Scenario: My school has Shibboleth and I have an Artstor account from a different institution
When I select my school’s name from the dropdown
And I submit the form 
Then I am asked if I have an account or if I have to create a new one
And when I select “I have an account”
Then I am shown a login form
And I enter my email and password
And all the details are correct
And I submit the form
Then I will see an error that says that account belongs to a different institution 