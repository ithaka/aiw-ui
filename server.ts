// These are important and needed before anything else
import 'zone.js/dist/zone-node';
import 'reflect-metadata';

import { enableProdMode } from '@angular/core';

import * as express from 'express';
import * as fs from 'fs';
import { join } from 'path';
import * as https from 'https';
import * as Sentry from '@sentry/node';

// Set up Sentry configuration
Sentry.init({ 
  // environment: process.env,
  dsn: 'https://80481e6afe274aa49c671606ca054bec@sentry.io/1391720'
});

// Faster server renders w/ Prod mode (dev mode never needed)
enableProdMode();

// Express server
const app = express();

// Sentry handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());
// The error handler must be before any other error middleware
app.use(Sentry.Handlers.errorHandler());

// Only use HTTPS settings locally
if (!process.env.SAGOKU) {
  console.log("Local Development: Setting SSL cert")
  // HTTPS/SSL credentials
  var privateKey  = fs.readFileSync('ssl/private.key', 'utf8');
  var certificate = fs.readFileSync('ssl/private.pem', 'utf8');
  var options = {key: privateKey, cert: certificate};
  // Use https server for hosting
  app.listen = function() {
    var server = https.createServer(options, this);
    return server.listen.apply(server, arguments);
  };
}

const PORT = process.env.PORT || 4000;
const DIST_FOLDER = join(process.cwd(), 'dist');

// Add domino
const domino = require('domino');
const win = domino.createWindow('');

win.scrollTo = (x, y) => {
  console.log('scrollTo called with: ' + x + ', ' + y)
};

global['window'] = win;
global['document'] = win.document;
global['Node'] = win.Node;
global['Text'] = win.Text;
global['HTMLElement'] = win.HTMLElement;
global['navigator'] = win.navigator;
global['XMLHttpRequest'] = require('xmlhttprequest').XMLHttpRequest;


// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const { AppServerModuleNgFactory, LAZY_MODULE_MAP } = require('./dist/server/main');

// Express Engine
import { ngExpressEngine } from '@nguniversal/express-engine';
// Import module map for lazy loading
import { provideModuleMap } from '@nguniversal/module-map-ngfactory-loader';

app.engine('html', (_, options, callback) => {
  let engine = ngExpressEngine({
      bootstrap: AppServerModuleNgFactory,
      providers: [
          { provide: 'request', useFactory: () => options.req, deps: [] },
          provideModuleMap(LAZY_MODULE_MAP)
      ]
  });
  engine(_, options, callback);
});

app.set('view engine', 'html');
app.set('views', join(DIST_FOLDER, 'browser'));

// TODO: implement data requests securely
app.get('/api/*', (req, res) => {
  res.status(404).send('data requests are not supported');
});

// // Serve static files from /browser
// app.use(express.static(join(DIST_FOLDER, 'browser')));

// Server static files from /browser
app.get('*.*', express.static(join(DIST_FOLDER, 'browser')));

// All regular routes use the Universal engine
app.get('*', (req, res) => {
  // res.render('index.html', { req });
  console.log('~ Fresh Request ~')
  res.render('index', { req, res }, 
    (err, html) => {
      if (err) {
        console.log("EXPRESS ERROR")
        console.log(err)
        return res.status(500).send(err)
      } else {
        return res.send(html)
      }
  });
});

// Start up the Node server
app.listen(PORT, () => {
  console.log(`Node server listening on https://localhost:${PORT}`);
});