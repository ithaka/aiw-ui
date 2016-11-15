import { Component } from '@angular/core';

import { AuthenticationService, User } from '../login/login.service';

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
  constructor(private auth: AuthenticationService) { 
    
  }

  getUser() : Object {
    console.log( this.auth.getUser() );
    return this.auth.getUser();
  }
  
  ngOnInit() {
    // console.log( Login.user )
  }
}
