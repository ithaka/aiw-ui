var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;

module.exports = function() {

  this.Given(/^I go to "([^"]*)"$/, function(state, callback) {
    browser.get(browser.baseUrl + state).then(callback);
  });

  this.Then(/^title should be "([^"]*)"$/, function(title, callback) {
    expect(browser.getTitle()).to.eventually.equal(title).and.notify(callback);
  });

  this.When(/^I search "([^"]*)"$/, function(keys, callback) {
    element(by.model('$ctrl.query')).sendKeys(keys).then(callback);
  });

  this.Then(/^results should be "([^"]*)"$/, function(expectedCount, callback) {
    var rows = element.all(by.repeater('phone in $ctrl.phones'));
    expect(rows.count()).to.eventually.equal(parseInt(expectedCount)).and.notify(callback);
  });
}