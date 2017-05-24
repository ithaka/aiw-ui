import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { LoginService } from '../../login/login.service';

// Project Dependencies
const { version: appVersion } = require('../../../../package.json');

@Component({
  selector: 'footer',
  providers: [
    LoginService
  ],
  templateUrl: './footer.component.html',
  styleUrls: [ './footer.component.scss' ],
})
export class Footer {
  private appVersion = '';
  private currentYear;
  
  // TypeScript public modifiers
  constructor( 
    private location: Location,
    private _router: Router,
    private _login: LoginService

  ) { 
    // Get version number
    this.appVersion = appVersion;

    // Set current year
    this.currentYear = new Date().getFullYear();
  }

  
  ngOnInit() {
    
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
