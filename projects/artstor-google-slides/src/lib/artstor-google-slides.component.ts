import { Component, OnInit } from '@angular/core';


//import { DomUtilityService, ScriptService } from '../../../../../shared';

@Component({
  selector: 'lib-artstor-google-slides',
})
export class ArtstorGoogleSlidesComponent implements OnInit {

  constructor(

  ) {

  }

  private static CLIENT_ID = '519908727744-8k5g7pubigns1c99gr2fd68rrtk24jau.apps.googleusercontent.com'
  private static API_KEY = 'AIzaSyAEUUgY6qyTGx371pZvpkWSNT9dStWw2zY'

// Array of API discovery doc URLs for APIs used by the quickstart
  private static DISCOVERY_DOCS = ["https://slides.googleapis.com/$discovery/rest?version=v1"]

// Authorization scopes required by the API multiple scopes can be
// included, separated by spaces.
  private static SCOPES = "https://www.googleapis.com/auth/presentations"

  ngOnInit() {}


  public authorize() {
    //this._gapi.auth2.getAuthInstance().signIn();
  }

}
