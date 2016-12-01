/**
 * @author: @AngularClass
 */

require('ts-node/register');
var helpers = require('./helpers');

exports.config = {
  baseUrl: 'http://localhost:3000/',

  // use `npm run e2e`
  specs: [
    helpers.root('src/**/**.e2e.ts'),
    helpers.root('src/**/*.e2e.ts')
  ],
  exclude: [],

  // framework: 'jasmine2',

   // set to "custom" instead of cucumber.
  framework: 'custom',

  // path relative to the current config file
  frameworkPath: require.resolve('protractor-cucumber-framework'),

  // require feature files
  specs: [
        '/features/**/*.feature' // accepts a glob
    ],
  cucumberOpts: {
      // require step definitions
    require: [
        '/features/**/*.steps.js' // accepts a glob
    ]
  },

  allScriptsTimeout: 110000,

  // jasmineNodeOpts: {
  //   showTiming: true,
  //   showColors: true,
  //   isVerbose: false,
  //   includeStackTrace: false,
  //   defaultTimeoutInterval: 400000
  // },
  directConnect: true,

  capabilities: {
    'browserName': 'chrome',
    'chromeOptions': {
      'args': ['show-fps-counter=true']
    }
  },

  onPrepare: function() {
    browser.ignoreSynchronization = true;
  },

  /**
   * Angular 2 configuration
   *
   * useAllAngular2AppRoots: tells Protractor to wait for any angular2 apps on the page instead of just the one matching
   * `rootEl`
   */
   useAllAngular2AppRoots: true
};
