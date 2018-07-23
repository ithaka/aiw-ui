/**
 * @author: @AngularClass
 */

const helpers = require('./helpers');
const webpack = require('webpack');
const webpackMerge = require('webpack-merge'); // used to merge webpack configs
const commonConfig = require('./webpack.common.js'); // the settings that are common to prod and dev

/**
 * Webpack Plugins
 */
const ProvidePlugin = require('webpack/lib/ProvidePlugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const WebpackMd5Hash = require('webpack-md5-hash');
const LoaderPlugin = require('webpack/lib/LoaderOptionsPlugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CompressionPlugin = require("compression-webpack-plugin");
const ClosureCompilerPlugin = require('webpack-closure-compiler');

/**
 * Webpack Constants
 */
const ENV = process.env.NODE_ENV = process.env.ENV = 'production';
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 8080;
const COMMON = commonConfig({env: ENV}).plugins.filter(plugin => plugin.options && plugin.options.metadata)[0].options.metadata;
const METADATA = webpackMerge(COMMON, {
  host: HOST,
  port: PORT,
  ENV: ENV,
  HMR: false
});

module.exports = function(env) {
  return webpackMerge(commonConfig({env: ENV}), {

    /**
     * Developer tool to enhance debugging
     *
     * See: http://webpack.github.io/docs/configuration.html#devtool
     * See: https://github.com/webpack/docs/wiki/build-performance#sourcemaps
     */
    // devtool: 'source-map',
    profile: true,
    bail: true,

    /**
     * Options affecting the output of the compilation.
     *
     * See: http://webpack.github.io/docs/configuration.html#output
     */
    output: {
      /**
       * The output directory as absolute path (required).
       *
       * See: http://webpack.github.io/docs/configuration.html#output-path
       */
      path: helpers.root('dist'),

      /**
       * Specifies the name of each output file on disk.
       * - IMPORTANT: You must not specify an absolute path here!
       * - See: http://webpack.github.io/docs/configuration.html#output-filename
       * 
       * "response-cache-control" to trigger Fastly caching:
       * - query param is attached to tell S3 to a attach a Cache-Control header
       * - S3 Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/RESTObjectGET.html
       * - This header is then picked up by Fastly, so it knows to cache our js files
       * - Fastly Docs: https://docs.fastly.com/guides/tutorials/cache-control-tutorial.html
       * 
       * "/assets" folder:
       * - An Apps-Gateway rule in ArtstorRouting.groovy ensures assets in "/assets" are not re-routed or modified in any way
       */
      // filename: 'assets/[name].[chunkhash].bundle.js?response-cache-control=' + encodeURIComponent('s-maxage=31536000'),
      filename: '[name].[chunkhash].bundle.js',

      /**
       * The filename of the SourceMaps for the JavaScript files.
       * They are inside the output.path directory.
       *
       * See: http://webpack.github.io/docs/configuration.html#output-sourcemapfilename
       */
      sourceMapFilename: '[name].[chunkhash].bundle.map',

      /**
       * The filename of non-entry chunks as relative path
       * inside the output.path directory.
       *
       * See: http://webpack.github.io/docs/configuration.html#output-chunkfilename
       */
      chunkFilename: '[id].[chunkhash].chunk.js'

    },

    /**
     * Add additional plugins to the compiler.
     *
     * See: http://webpack.github.io/docs/configuration.html#plugins
     */
    plugins: [
      /**
       * Prod builds should not emit assets if there is an error
       */
      new webpack.NoEmitOnErrorsPlugin(),
      /**
       * Plugin: WebpackMd5Hash
       * Description: Plugin to replace a standard webpack chunkhash with md5.
       *
       * See: https://www.npmjs.com/package/webpack-md5-hash
       */
      new WebpackMd5Hash(),

      // new webpack.LoaderOptionsPlugin({
      //   minimize: true
      // }),

      /**
       * Plugin: UglifyJSPlugin
       * See: https://webpack.js.org/plugins/uglifyjs-webpack-plugin
       */
      // new UglifyJSPlugin({
      //   uglifyOptions: {
      //   //   ecma: 5,
      //   //   mangle: false,
      //   //   sourceMap: true,
      //   //   compress: {
      //   //   warnings: true
      //   //  }
      //   }
      // }),

      /**
       * Plugin: ClosureCompilerPlugin
       * see: https://github.com/roman01la/webpack-closure-compiler
       */
      new ClosureCompilerPlugin({
          compiler: {
            // jar: 'path/to/your/custom/compiler.jar', //optional
            language_in: 'ECMASCRIPT6',
            language_out: 'ECMASCRIPT5',
            compilation_level: 'SIMPLE'
            // create_source_map: true
          },
          concurrency: 3,
      }),


      /**
       * Plugin: CompressionWebpackPlugin
       * Prepare compressed versions of assets to serve them with Content-Encoding
       * See: https://github.com/webpack-contrib/compression-webpack-plugin
       */
      // new CompressionPlugin({
      //   regExp: /\.css$|\.html$|\.js$|\.map$/,
      //   threshold: 2 * 1024
      // }),
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
        'ENV': JSON.stringify(METADATA.ENV),
        'HMR': METADATA.HMR,
        'process.env': {
          'ENV': JSON.stringify(METADATA.ENV),
          'NODE_ENV': JSON.stringify(METADATA.ENV),
          'HMR': METADATA.HMR,
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
            emitErrors: true,
            failOnHint: true,
            resourcePath: 'src'
          },
          htmlLoader: {
            minimize: true,
            removeAttributeQuotes: false,
            caseSensitive: true,
            customAttrSurround: [
              [/#/, /(?:)/],
              [/\*/, /(?:)/],
              [/\[?\(?/, /(?:)/]
            ],
            customAttrAssign: [/\)?\]?=/]
          }
        },
        debug: false
      })

    ],

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
