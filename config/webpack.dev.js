/**
 * @author: @AngularClass
 */

const helpers = require('./helpers');
const webpackMerge = require('webpack-merge'); // used to merge webpack configs
const commonConfig = require('./webpack.common.js'); // the settings that are common to prod and dev

/**
 * Webpack Plugins
 */
const DefinePlugin = require('webpack/lib/DefinePlugin');
const NamedModulesPlugin = require('webpack/lib/NamedModulesPlugin');
const LoaderPlugin = require('webpack/lib/LoaderOptionsPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

/**
 * Webpack Constants
 */
const ENV = process.env.ENV = process.env.NODE_ENV = 'development';
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3000;
const HMR = helpers.hasProcessFlag('hot');
const API_URL = '//stage.artstor.org';
const COMMON = commonConfig({env: ENV}).plugins.filter(plugin => plugin.options && plugin.options.metadata)[0].options.metadata;
const METADATA = webpackMerge(COMMON, {
  host: HOST,
  port: PORT,
  ENV: ENV,
  HMR: HMR,
  API_URL: API_URL
});

/**
 * Webpack configuration
 *
 * See: http://webpack.github.io/docs/configuration.html#cli
 */
module.exports = function(options) {
  return webpackMerge(commonConfig({env: ENV}), {

    /**
     * Developer tool to enhance debugging
     *
     * See: http://webpack.github.io/docs/configuration.html#devtool
     * See: https://github.com/webpack/docs/wiki/build-performance#sourcemaps
     */
    devtool: 'eval', // Eval was specifically chosen over 'cheap-module-source-map' for better browser inspection support
    cache: true,
    parallelism: 10,
    performance: false,
    mode: "development",

    /**
     * Dev environment should have optimizations turned OFF
     */
    optimization: {
      removeAvailableModules: false,
      removeEmptyChunks: false,
      mergeDuplicateChunks: false,
      flagIncludedChunks: false,
      splitChunks: false,
      runtimeChunk: false,
      minimize: false
    },

    /**
     * Options affecting the output of the compilation.
     *
     * See: http://webpack.github.io/docs/configuration.html#output
     */
    output: {
      /**
       * Enabled in development mode. Elsewise disabled.
       * These extra comment are useful for debugging, especially with the eval devtool.
       */
      pathinfo: true,
      /**
       * The output directory as absolute path (required).
       *
       * See: http://webpack.github.io/docs/configuration.html#output-path
       */
      path: helpers.root('dist'),

      /**
       * Specifies the name of each output file on disk.
       * IMPORTANT: You must not specify an absolute path here!
       *
       * See: http://webpack.github.io/docs/configuration.html#output-filename
       */
      filename: '[name].bundle.js',

      /**
       * The filename of the SourceMaps for the JavaScript files.
       * They are inside the output.path directory.
       *
       * See: http://webpack.github.io/docs/configuration.html#output-sourcemapfilename
       */
      sourceMapFilename: '[name].map',

      /** The filename of non-entry chunks as relative path
       * inside the output.path directory.
       *
       * See: http://webpack.github.io/docs/configuration.html#output-chunkfilename
       */
      chunkFilename: '[id].chunk.js',

      library: 'ac_[name]',
      libraryTarget: 'var',
    },

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
      // NOTE: when adding more properties, make sure you include them in custom-typings.d.ts
      new DefinePlugin({
        'ENV': JSON.stringify(METADATA.ENV),
        'HMR': METADATA.HMR,
        'API_URL': JSON.stringify(METADATA.API_URL),
        'process.env': {
          'ENV': JSON.stringify(METADATA.ENV),
          'NODE_ENV': JSON.stringify(METADATA.ENV),
          'HMR': METADATA.HMR,
          'API_URL': JSON.stringify(METADATA.API_URL)
        }
      }),

      /**
         * Plugin: NamedModulesPlugin (experimental)
         * Description: Uses file names as module name.
         *
         * See: https://github.com/webpack/webpack/commit/a04ffb928365b19feb75087c63f13cadfc08e1eb
         */
        new NamedModulesPlugin(),

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
        },
        debug: true
      }),

      new HtmlWebpackPlugin({
        template: helpers.root("src/index.html"),
        metadata: METADATA
      })

    ],

    /**
     * Webpack Development Server configuration
     * Description: The webpack-dev-server is a little node.js Express server.
     * The server emits information about the compilation state to the client,
     * which reacts to those events.
     *
     * See: https://webpack.github.io/docs/webpack-dev-server.html
     */
    devServer: {
      port: METADATA.port,
      host: METADATA.host,
      historyApiFallback: true,
      // watchOptions: {
      //   aggregateTimeout: 300,
      //   poll: 1000
      // },
      noInfo: true
    },

    /*
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

  });
}
