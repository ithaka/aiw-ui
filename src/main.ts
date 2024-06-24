// /*
//  * Angular bootstraping
//  */
// import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
// // import { decorateModuleRef } from 'app/environment';
// import { bootloader } from '@angularclass/hmr';

// /*
//  * App Module
//  * our top level module that holds all of our components
//  */
// import { AppModule } from 'app';

// /*
//  * Bootstrap our Angular app with a top level NgModule
//  */
// export function main(): Promise<any> {
//   return platformBrowserDynamic()
//     .bootstrapModule(AppModule)
//     .then(decorateModuleRef)
//     .catch(err => console.error(err));
// }

// // needed for hmr
// // in prod this is replace for document ready
// bootloader(main);

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import '@pharos/core/web-components/pharos-tooltip';

const FLAGS_QUERY = `
  query AiwFlagList($flagsFlagList: [String]) {
    flags(flagList: $flagsFlagList) {
      enabled
    }
  }
`;
const REDIRECT_FLAG = "artstor_client_redirection";
const OPTIONS = {
  operationName: 'AiwFlagList',
  query: FLAGS_QUERY,
  variables: {
    flagsFlagList: [REDIRECT_FLAG],
  },
};

const initializeApp = () => {
  if (environment.production) {
    enableProdMode();
  }

  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.log(err));
}

fetch('/ui/data-fetch/gateway', {
  method: 'POST',
  headers: {
    'authorization': 'aiw-ui',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(OPTIONS),
})
  .then(response => response.json())
  .then(flagData => {
    const flagStates = flagData.data ? flagData.data : null;
    const enabledFlags = flagStates ? flagStates.flags.enabled : [];
    const doRedirect = enabledFlags.includes(REDIRECT_FLAG);

    const currentRequest = window.location.href;

    if (currentRequest.includes('/#/')) {
      const params = new URLSearchParams({ artstorPath: currentRequest }).toString();

      fetch(`/get-the-redirect-please/?${params}`)
        .then(redirectResponse => redirectResponse.json())
        .then(redirectData => {
          if (redirectData.location) {
            if (doRedirect) {
              console.log('Redirecting to:', redirectData.location);
              window.location.replace(redirectData.location);
            } else {
              console.log('Will eventually redirect to:', redirectData.location);
              initializeApp();
            }
          } else {
            initializeApp();
          }
        });
    } else {
      initializeApp();
    }
  });
