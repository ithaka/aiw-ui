// Angular 2
// rc2 workaround
import { enableDebugTools, disableDebugTools } from '@angular/platform-browser';
import { ApplicationRef, enableProdMode, ErrorHandler } from '@angular/core';
// Error tracking utility for sentry.io
import * as Raven from 'raven-js'

// Project Dependencies
import { version } from '../../../../package.json'


// Env vars
import { environment } from 'environments/environment'


// Environment Providers
let PROVIDERS: any[] = [
  // common env directives
];

// Angular debug tools in the dev console
// https://github.com/angular/angular/blob/86405345b781a9dc2438c0fbe3e9409245647019/TOOLS_JS.md
let _decorateModuleRef = function identity<T>(value: T): T { return value; };

if (environment.production) {
  // Production
  disableDebugTools();
  enableProdMode();

  // Sentry Raven reporter
  Raven.config('https://9ef1f98534914bf6826e202370d1f627@sentry.io/209953', {
    release: version
  }).install();
  class RavenErrorHandler implements ErrorHandler {
    handleError(err: any): void {
      Raven.captureException(err);
    }
  }

  PROVIDERS = [
    ...PROVIDERS,
    { provide: ErrorHandler, useClass: RavenErrorHandler }
    // custom providers in production
  ];

} else {

  _decorateModuleRef = (modRef: any) => {
    const appRef = modRef.injector.get(ApplicationRef);
    const cmpRef = appRef.components[0];

    let _ng = (<any>window).ng;
    enableDebugTools(cmpRef);
    (<any>window).ng.probe = _ng.probe;
    (<any>window).ng.coreTokens = _ng.coreTokens;
    return modRef;
  };

  // Development
  PROVIDERS = [
    ...PROVIDERS,
    // custom providers in development
  ];

}

export const decorateModuleRef = _decorateModuleRef;

export const ENV_PROVIDERS = [
  ...PROVIDERS
];
