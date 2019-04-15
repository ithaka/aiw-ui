// Angular 2
// rc2 workaround
import { enableDebugTools, disableDebugTools } from '@angular/platform-browser';
import { ApplicationRef, enableProdMode, ErrorHandler, Injectable } from '@angular/core';
// Error tracking utility for sentry.io
import * as Sentry from '@sentry/browser';
// Project Dependencies
import { version } from '../../package.json'
// Env vars
import { environment } from 'environments/environment'

// Environment Providers
let PROVIDERS: any[] = [
  // common env directives
];

// Angular debug tools in the dev console
// https://github.com/angular/angular/blob/86405345b781a9dc2438c0fbe3e9409245647019/TOOLS_JS.md
let _decorateModuleRef = function identity<T>(value: T): T { return value; };

// Sentry Raven reporter
Sentry.init({ 
  dsn: 'https://abcdee57ec1f4ae6ac3128bdcaef39bd@sentry.io/230749',
  release: version
});
@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  constructor() {}
  handleError(error) {
    const eventId = Sentry.captureException(error.originalError || error);
    Sentry.showReportDialog({ eventId });
  }
}

if (environment.production) {
  // Production
  disableDebugTools();
  enableProdMode();

  PROVIDERS = [
    ...PROVIDERS,
    // Use Sentry error handler
    { provide: ErrorHandler, useClass: SentryErrorHandler }
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
