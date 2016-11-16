import { Component } from '@angular/core';

import { AuthenticationService } from '../login/login.service';

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

  getUser() : Object {
    console.log( this._auth.getUser() );
    return this._auth.getUser();
  }
  
  ngOnInit() {
    
  }
}
