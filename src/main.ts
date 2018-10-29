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

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
