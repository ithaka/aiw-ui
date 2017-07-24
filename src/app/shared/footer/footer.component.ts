import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { LoginService } from '../../login/login.service';
import { AuthService } from '../auth.service';

// Project Dependencies
const { version: appVersion } = require('../../../../package.json');

declare let google

@Component({
  selector: 'footer',
  providers: [
    LoginService
  ],
  templateUrl: './footer.component.html',
  styleUrls: [ './footer.component.scss' ],
})
export class Footer {
  private subscriptions: Subscription[] = [];
  private appVersion = '';
  private currentYear;
  private user: any = {};
  
  // TypeScript public modifiers
  constructor( 
    private location: Location,
    private _router: Router,
    private _login: LoginService,
    private _auth: AuthService

  ) { 
    // Get version number
    this.appVersion = appVersion;

    // Set current year
    this.currentYear = new Date().getFullYear();
  }

  
  ngOnInit() {
    
    this.subscriptions.push(
      this._router.events.subscribe(e => {
        if (e instanceof NavigationEnd) {
            this.user = this._auth.getUser();
        }
      })
    );

    if (google && google.translate) {
      new google.translate.TranslateElement(
          {
              pageLanguage: 'en',
              layout: google.translate.TranslateElement && google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false
          },
          'google_translate_element'
      )
    }
  }

  private logout(): void {
    this._login.logout()
      .then(() => {
        if (this.location.path().indexOf("home") >= 0) {
          location.reload() // this will reload the app and give the user a feeling they actually logged out
        } else {
          this._router.navigate(['/home'])
        }
      })
  }
}
