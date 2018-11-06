// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', 'jasmine-spec-tags', 'pact', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-jasmine-spec-tags'),
      require('@pact-foundation/karma-pact'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-mocha-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, '../coverage'),
      reports: ['html', 'lcovonly'],
      fixWebpackSourcePaths: true
    },
    reporters: ['mocha', 'progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_ERROR,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: true,

    /**
     * Configure Pact mock servers
     * - EACH provider needs a configuration with a unique *port*
     */
    pact: [
      {
        cors: true, 
        host: 'localhost',
        port: 1201, 
        dir: 'pacts/',
        consumer: 'aiw-ui',
        provider: 'binder-group'
      },
      {
        cors: true, 
        host: 'localhost',
        port: 1202, 
        dir: 'pacts/',
        consumer: 'aiw-ui',
        provider: 'binder-metadata'
      },
      {
        cors: true, 
        host: 'localhost',
        port: 1203, 
        dir: 'pacts/',
        consumer: 'aiw-ui',
        provider: 'artaa_service'
      }
    ], 
    // 4) here we can define proxies to redirect requests from our pact tests to the mock server
    proxies: { 
      '/api/v1/group': 'http://localhost:1201/api/v1/group',
      '/api/v1/metadata': 'http://localhost:1202/api/v1/metadata',
      '/api/secure/user/': 'http://localhost:1203/api/secure/user/',
      '/api/secure/user/abcdefg': 'http://localhost:1203/api/secure/user/abcdefg'
    }

  });
};