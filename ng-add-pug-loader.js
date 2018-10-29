/**
* Adds the pug-loader inside Angular CLI's webpack config, if not there yet.
* @see https://github.com/danguilherme/ng-cli-pug-loader
*/
const fs = require('fs');
const commonCliConfig = 'node_modules/@angular-devkit/build-angular/src/angular-cli-files/models/webpack-configs/common.js';
const pugRule = '{ test: /.pug$/, use: [ { loader: "apply-loader" }, { loader: "pug-loader" } ] },';
// See these:
// https://github.com/danguilherme/ng-cli-pug-loader/issues/5
// https://medium.com/@strakercarryer/oh-man-thank-you-for-posting-your-4-e5e307fe816b
// Thanks to danguilherme and Straker Carryer for spotting the issues with my approach
try {
  // Just in case the file isn't found.
  const data = fs.readFileSync(commonCliConfig);
  const configText = data.toString();
  if (configText.indexOf(pugRule) > -1) { return; }
  const position = configText.indexOf('rules: [') + 8;
  const output = [configText.slice(0, position), pugRule,     
  configText.slice(position)].join('');
  const file = fs.openSync(commonCliConfig, 'r+');
  // Insert the pug webpack rule
  fs.writeFileSync(file, output);
  fs.closeSync(file);
} catch (e) {
  console.error('There was an error while injecting the pug loader', e);
}