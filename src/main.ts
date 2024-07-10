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
const SESSION_QUERY = `
  query AiwSession {
    session(useHeaders: true) {
      uuid
    }
  }
`;
const REDIRECT_FLAG = "artstor_client_redirection";
const FLAG_OPTIONS = {
  operationName: 'AiwFlagList',
  query: FLAGS_QUERY,
  variables: {
    flagsFlagList: [REDIRECT_FLAG],
  },
};
const SESSION_OPTIONS = {
  operationName: 'AiwSession',
  query: SESSION_QUERY,
};

const initializeApp = () => {
  if (environment.production) {
    enableProdMode();
  }

  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.log(err));
}

const cookies = document.cookie;
let uuid = undefined;

if (cookies) {
  const cookieList = cookies.split('; ');
  let uuidCookie = cookieList.find(row => row.startsWith('UUID='));
  if (uuidCookie) {
    uuid = uuidCookie.split('=')[1];
  }
}
if (!uuid) {
  let uuid = (crypto as any).randomUUID();
  document.cookie = `UUID=${uuid}; path=/; max-age=31536000`;
}

fetch('/unfederated-session-service/query', {
  method: 'POST',
  headers: {
    'authorization': 'aiw-ui',
    'Content-Type': 'application/json',
    'uuid-session': 'true',
    'Cookie': 'UUID=',
  },
  body: JSON.stringify(SESSION_OPTIONS),
})
  .then(response => response.json())
  .then(sessionData => {
    fetch('/ui/data-fetch/gateway', {
      method: 'POST',
      headers: {
        'authorization': 'aiw-ui',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(FLAG_OPTIONS),
    })
      .then(response => response.json())
      .then(flagData => {
        const flagStates = flagData.data ? flagData.data : null;
        const enabledFlags = flagStates ? flagStates.flags.enabled : [];
        const doRedirect = enabledFlags.includes(REDIRECT_FLAG);

        const currentRequest = window.location.href;

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
      });
  });
