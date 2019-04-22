const path = require('path');
const webpack = require('webpack');

module.exports = (env) => {
  console.log("Env value: " + env)
  let appdynamicsName = (env == 'prod' ? 'Artstor_PROD' : 'Artstor_TEST')
  console.log("AppDynamics applicationName used: " + appdynamicsName)
  return {
    entry: { server: './server.ts' },
    resolve: { extensions: ['.js', '.ts'] },
    target: 'node',
    // TO-DO: Enable "production" mode for going live with Universal
    mode: 'development',
    // this makes sure we include node_modules and other 3rd party libraries
    externals: [
      /node_modules/
    ],
    output: {
      path: path.join(__dirname, 'dist'),
      filename: '[name].js'
    },
    module: {
      rules: [{ test: /\.ts$/, loader: 'ts-loader' }]
    },
    plugins: [
      // Temporary Fix for issue: https://github.com/angular/angular/issues/11580
      // for 'WARNING Critical dependency: the request of a dependency is an expression'
      new webpack.ContextReplacementPlugin(
        /(.+)?angular(\\|\/)core(.+)?/,
        path.join(__dirname, 'src'), // location of your src
        {} // a map of your routes
      ),
      new webpack.ContextReplacementPlugin(
        /(.+)?express(\\|\/)(.+)?/,
        path.join(__dirname, 'src'),
        {}
      ),
      // Attach AppDynamics code
      new webpack.BannerPlugin({
        raw: true,
        entryOnly: true,
        banner: `
        require("appdynamics").profile({
          controllerHostName: 'Ithaka.saas.appdynamics.com',
          controllerPort: 443, 
          controllerSslEnabled: true,  // Set to true if controllerPort is SSL
          accountName: 'Ithaka', // Required for SaaS accounts
          accountAccessKey: '8e51d6a16fb3', // Required for SaaS accounts
          applicationName: '${appdynamicsName}',
          tierName: 'artstor-ui-ssr', 
          nodeName: 'artstor-ui-ssr-01'
        });
        `
      })
    ]
  }
};
