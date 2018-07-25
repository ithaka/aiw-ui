/**
 * @author: @AngularClass
 */

const helpers = require('./helpers');

/**
 * Webpack Plugins
 */
const ProvidePlugin = require('webpack/lib/ProvidePlugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const LoaderPlugin = require('webpack/lib/LoaderOptionsPlugin');

/**
 * Webpack Constants
 */
const ENV = process.env.ENV = process.env.NODE_ENV = 'test';
const API_URL = '/';

/**
 * Webpack configuration
 *
 * See: http://webpack.github.io/docs/configuration.html#cli
 */
module.exports = function (options) {
  return {

    /**
     * Source map for Karma from the help of karma-sourcemap-loader &  karma-webpack
     *
     * Do not change, leave as is or it wont work.
     * See: https://github.com/webpack/karma-webpack#source-maps
     */
    devtool: 'inline-source-map',

    /**
     * Options affecting the resolving of modules.
     *
     * See: http://webpack.github.io/docs/configuration.html#resolve
     */
    resolve: {

      /**
       * An array of extensions that should be used to resolve modules.
       *
       * See: http://webpack.github.io/docs/configuration.html#resolve-extensions
       */
      extensions: ['.ts', '.js', '.json'],

      /**
       * Make sure root is src
       */
      modules: [helpers.root('src'), 'node_modules'],

    },

    /**
     * Options affecting the normal modules.
     *
     * See: http://webpack.github.io/docs/configuration.html#module
     */
    module: {

      /**
       * An array of automatically applied loaders.
       *
       * IMPORTANT: The loaders here are resolved relative to the resource which they are applied to.
       * This means they are not resolved relative to the configuration file.
       *
       * See: http://webpack.github.io/docs/configuration.html#module-loaders
       */
      rules: [

        {
          test: /\.js$/,
          loader: 'source-map-loader',
          exclude: [
            // these packages have problems with their sourcemaps
            helpers.root('node_modules/rxjs'),
            helpers.root('node_modules/@angular')
          ],
          enforce: 'pre'
        },

        /**
         * Typescript loader support for .ts and Angular 2 async routes via .async.ts
         *
         * See: https://github.com/s-panferov/awesome-typescript-loader
         */
        // {
        //   test: /\.ts$/,
        //   loader: 'awesome-typescript-loader',
        //   query: {
        //     // use inline sourcemaps for "karma-remap-coverage" reporter
        //     sourceMap: false,
        //     inlineSourceMap: true,
        //     compilerOptions: {

        //       // Remove TypeScript helpers to be injected
        //       // below by DefinePlugin
        //       removeComments: true

        //     }
        //   },
        //   exclude: [/\.e2e\.ts$/]
        // },

        {
          test: /\.ts$/,
          loaders: [
            // '@angularclass/hmr-loader?pretty=' + !isProd + '&prod=' + isProd,
            'awesome-typescript-loader',
            'angular2-template-loader'
          ],
          exclude: [/\.e2e\.ts$/]
        },

        /**
         * Json loader support for *.json files.
         *
         * See: https://github.com/webpack/json-loader
         */
        // { test: /\.json$/, loader: 'json-loader', exclude: [helpers.root('src/index.html')] },

        /*
         * Compile sass files
         * Returns file content as string
         */
        {
          test: /\.scss$/,
          loaders: ['raw-loader', 'sass-loader']
        },
        /**
         * Raw loader support for *.css files
         * Returns file content as string
         *
         * See: https://github.com/webpack/raw-loader
         */
        { test: /\.css$/, loaders: ['to-string-loader', 'css-loader'], exclude: [helpers.root('src/index.html')] },

        /**
         * Raw loader support for *.html
         * Returns file content as string
         *
         * See: https://github.com/webpack/raw-loader
         */
        { test: /\.html$/, loader: 'raw-loader', exclude: [helpers.root('src/index.html')] },

        /**
         * support for pug or jade templates
         */
        {
          test: /\.(pug|jade)$/,
          loader: ['raw-loader', 'pug-html-loader']
        },

        /**
         * Instruments JS files with Istanbul for subsequent code coverage reporting.
         * Instrument only testing sources.
         *
         * See: https://github.com/deepsweet/istanbul-instrumenter-loader
         */
        {
          test: /\.(js|ts)$/, loader: 'istanbul-instrumenter-loader',
          include: helpers.root('src'),
          exclude: [
            /\.(e2e|spec)\.ts$/,
            /node_modules/
          ],
          enforce: 'post'
        }
      ]
    },

    /**
     * Add additional plugins to the compiler.
     *
     * See: http://webpack.github.io/docs/configuration.html#plugins
     */
    plugins: [

      /**
       * Plugin: DefinePlugin
       * Description: Define free variables.
       * Useful for having development builds with debug logging or adding global constants.
       *
       * Environment helpers
       *
       * See: https://webpack.github.io/docs/list-of-plugins.html#defineplugin
       */
      // NOTE: when adding more properties make sure you include them in custom-typings.d.ts
      new DefinePlugin({
        'ENV': JSON.stringify(ENV),
        'HMR': false,
        'API_URL': API_URL,
        'process.env': {
          'ENV': JSON.stringify(ENV),
          'NODE_ENV': JSON.stringify(ENV),
          'HMR': false,
          'API_URL': API_URL
        }
      }),

      /**
       * Static analysis linter for TypeScript advanced options configuration
       * Description: An extensible linter for the TypeScript language.
       *
       * See: https://github.com/wbuchwalter/tslint-loader
       */

      new LoaderPlugin({
        options: {
          tslint: {
            emitErrors: false,
            failOnHint: false,
            resourcePath: 'src'
          }
        }
      })
    ],

    /**
     * Include polyfills or mocks for various node stuff
     * Description: Node configuration
     *
     * See: https://webpack.github.io/docs/configuration.html#node
     */
    node: {
      console: false,
      global: true,
      process: true,
      __filename: "mock",
      __dirname: "mock",
      Buffer: true,
      setImmediate: true
    }

  };
}
