// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  API_URL: '//stage.artstor.org',
  FORUM_URL: 'http://test.forum.jstor.org',
  STOR_URL: '//stor.stage.artstor.org/stor',
  GAPI_TEST: [
    "519908727744-qbcipn724k938hhsrufqgatu5e81t10s.apps.googleusercontent.com",
    "AIzaSyDHAAKMjGUxxQbZCeHJDCpAeLmQ2A7HqOI",
    ['https://slides.googleapis.com/$discovery/rest?version=v1'],
    'https://www.googleapis.com/auth/presentations'
  ]
};

/*
 * In development mode, for easier debugging, you can ignore zone related error
 * stack frames such as `zone.run`/`zoneDelegate.invokeTask` by importing the
 * below file. Don't forget to comment it out in production mode
 * because it will have a performance impact when errors are thrown
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
