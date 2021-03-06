// Prereq Dependencies (required first)
import 'zone.js/dist/zone-node'
import 'reflect-metadata'
// Dependencies
import { enableProdMode } from '@angular/core';
import * as express from 'express';
import * as isbot from 'isbot'
import * as fs from 'fs';
import { join } from 'path';
import * as https from 'https';
const jsBundlePattern = new RegExp(/\w*\.\w*\.js$/g);
// Set up Sentry configuration
// > Name "NodeSentry" to keep separate from front-end "Sentry" reporter
// > "artstor-ui-ssr" project in Sentry for server-side reporting
const NodeSentry = require('@sentry/node')
NodeSentry.init({
  environment: process.env,
  dsn: 'https://80481e6afe274aa49c671606ca054bec@sentry.io/1391720'
})
// Faster server renders w/ Prod mode (dev mode never needed)
enableProdMode()
// Express server
const app = express()
// Sentry handler must be the first middleware on the app
app.use(NodeSentry.Handlers.requestHandler() as express.RequestHandler)
// The error handler must be before any other error middleware
app.use(NodeSentry.Handlers.errorHandler() as express.ErrorRequestHandler)
// Only use HTTPS settings locally
if (!process.env.SAGOKU) {
  console.log("Local Development: Setting SSL cert")
  // HTTPS/SSL credentials
  var privateKey  = fs.readFileSync('ssl/private.key', 'utf8')
  var certificate = fs.readFileSync('ssl/private.pem', 'utf8')
  var options = {key: privateKey, cert: certificate}
  // Use https server for hosting
  app.listen = function() {
    var server = https.createServer(options, this)
    return server.listen.apply(server, arguments)
  }
}
// Hosting configuration
const PORT = process.env.PORT || 4000
const DIST_FOLDER = join(process.cwd(), 'dist')
/**
 * DOM and browser specific reference workarounds
 * - Libraries such as OpenSeaDragon require multiple references to client/browser interfaces
 * - The "Angular Universal way" should always be preferred over these libraries/references
 */
// Add domino
const domino = require('domino')
const win = domino.createWindow('')
// Bind to scrollTo function to prevent errors in dependencies
win.scrollTo = (x, y) => {
  // For debugging
  // console.log('scrollTo called with: ' + x + ', ' + y)
}
// Prevent reference errors (PDFjs)
win.requestAnimationFrame = (callback) => { }
global['window'] = win
global['document'] = win.document
global['Node'] = win.Node
global['Text'] = win.Text
global['HTMLElement'] = win.HTMLElement
global['Element'] = win.Element // (PDFjs)
global['navigator'] = win.navigator
global['XMLHttpRequest'] = require('xmlhttprequest').XMLHttpRequest
global['Document'] = win.Document
/**
 * Angular Universal init
 */
// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const { AppServerModuleNgFactory, LAZY_MODULE_MAP } = require('../dist/server/main')
// Express Engine
import { ngExpressEngine } from '@nguniversal/express-engine'
// Import module map for lazy loading
import { provideModuleMap } from '@nguniversal/module-map-ngfactory-loader'

// Configure Express rendering to use Angular Universal
app.engine('html', (_, options, callback) => {
  let engine = ngExpressEngine({
      bootstrap: AppServerModuleNgFactory,
      providers: [
          { provide: 'request', useFactory: () => options.req, deps: [] },
          provideModuleMap(LAZY_MODULE_MAP)
      ]
  })
  engine(_, options, callback)
})
app.set('view engine', 'html')
app.set('views', join(DIST_FOLDER, 'browser'))
/**
 * /api requests should not hit this server
 * - Locally, requests are pointed at stage.artstor.org
 * - Deployed, apps-gateway routes /api requests to the correct service
 */
app.get('/api/*', (req, res) => {
  res.status(404).send('data requests are not supported')
})
/**
 * Handle server-rendered paths
 */
app.get(['/public/*', '/object/*'], (req, res, next) => {
  console.log('/public route request received')
  try {
    res.render('index', { req, res },
      (err, html) => {
        if (err) {
          console.log("Express Error", err)
          return res.status(500).send(err)
        } else {
          // Hide no js messaging for server-rendered pages
          html = html.replace('<noscript>', '<div class="no-script--hidden">')
          html = html.replace('</noscript>', '</div>')
          // Turn off javascript for crawlers to avoid content rewrite errors
          if (isbot(req.headers['user-agent'])) {
            let scriptTest = new RegExp(/<script.*<\/script>/g)
            // Strip javascript script tags
            html = html.replace(scriptTest, '')
          }
          // @TODO AIR-2439 - using a 404 to prevent PLE on failed metadata call, throw 503 again once fixed?
          // Canonical tag on render success, 503 on error (signals to Google)
          // + We're using a 503 here to indicate "Service Unavailable" - this ensures Google will come back
          // + We continue returning the page so a user is not interrupted
          // + "asset.rendered.success" tag is attached in asset-page to indicate render
          if (new RegExp(/\"asset\.rendered\.success\"/g).test(html)) {
            // Attach canonical meta tag if successful
            html = html.replace('<head>', '<head><link rel="canonical" href="'+req.originalUrl+'"/>')
          } else {
            // Return a 503 if asset was not rendered successfully
            // NOTE: Temporarily return a 404 until fixing 503s for some assets
            return res.status(404).send(html)
          }
          return res.send(html)
        }
    });
  } catch(err) {
    // If render fails, notify Sentry and pass static pages to user
    NodeSentry.captureException(err)
    next()
  }
});
/**
 * Apply Fastly Cache headers to anything but /index.html
 */
app.use('*', (req, res, next) => {
  let url = req.originalUrl
  // Select paths to add cache headers to
  if (url.indexOf('/assets/') > -1 || jsBundlePattern.test(url)){
    // Max age set to 86400 seconds, 24 hours
    res.set('Surrogate-Control', 'public, max-age=86400') // higher priority value used by Fastly
    res.set('Cache-Control', 'public, max-age=86400') // value used by clients/browsers
  }
  next()
})
/**
 *  Serve not server-rendered paths and static files from /browser
 *  - This is our "traditional" static app hosting
 */
app.use('/assets/', express.static(join(DIST_FOLDER, 'browser')))
app.use('/', express.static(join(DIST_FOLDER, 'browser')))
// Specifically allow file types that live in the root of /dist/browser
app.use(':filename.js', express.static(join(DIST_FOLDER, 'browser')))
app.use(':filename.html', express.static(join(DIST_FOLDER, 'browser')))
app.use(':filename.txt', express.static(join(DIST_FOLDER, 'browser')))
app.use(':filename.xml', express.static(join(DIST_FOLDER, 'browser')))
app.use(':filename.css', express.static(join(DIST_FOLDER, 'browser')))
// Pass all other/unspecified routes to the Angular static app
app.get('*', (req, res) => {
  // res.redirect('/#'+req.url)
  res.sendFile(join(DIST_FOLDER, 'browser/index.html'))
})

app.post('*', (req, res) => {
  res.status(405).send('Method not allowed')
})

app.put('*', (req, res) => {
  res.status(405).send('Method not allowed')
})

// Start up the Node server
app.listen(PORT, () => {
  console.log(`Node server listening on https://localhost:${PORT}`)
})
