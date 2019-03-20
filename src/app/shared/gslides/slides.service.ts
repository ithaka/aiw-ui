/// <reference types="@types/gapi" />
/// <reference types="@types/gapi.auth2" />
/// <reference types="@types/gapi.client.slides" />

import { Injectable } from '@angular/core';
import { environment } from 'environments/environment'

@Injectable({
  providedIn: 'root'
})
export class SlidesService {
  constructor() {}

  /**
   *  loadClientInit
   *  Called to init gapi client and auth2 library
   */
  public loadClientInit(): void | Error {
    return gapi.load('client:auth2', this.initClient)
  }

  /**
   *  gAuthSignIn - Google OAuth2 sign in
   */
  public gAuthSignIn(): Promise<gapi.auth2.GoogleUser> | Error {
    return gapi.auth2.getAuthInstance().signIn();
  }

  /**
  *  gAuthSignOut - Google OAuth2 sign out
  */
  public gAuthSignOut(): gapi.auth2.GoogleAuth | Error {
    return gapi.auth2.getAuthInstance().signOut();
  }

/**
 *  Initializes the API client library.
 */
  public initClient(): Promise<void> | Error {
    return gapi.client.init({
      clientId: <string>environment.GAPI_TEST[0],
      apiKey: <string>environment.GAPI_TEST[1],
      discoveryDocs: <string[]>environment.GAPI_TEST[2],
      scope: <string>environment.GAPI_TEST[3]
    })
  }

}
