import { Component } from '@angular/core';

import { AuthenticationService } from '../login/login.service';
// import { LocalStorage, SessionStorage } from "angular2-localstorage/WebStorage";

@Component({
  selector: 'nav-bar',
  providers: [
    AuthenticationService
  ],
  templateUrl: './nav.component.html',
  styleUrls: [ './nav.component.scss' ],
})
export class Nav {
  
  // TypeScript public modifiers
  constructor(private _auth: AuthenticationService) { 
    
  }

  logout() {
    this._auth.logout();
  }

  getUserName() : String {
    return this._auth.getUser() ? this._auth.getUser().username : "";
  }
  
  ngOnInit() {
    
  }
}
