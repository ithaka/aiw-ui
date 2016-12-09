import { Component } from '@angular/core';

import { LoginService } from '../../login/login.service';
import { AuthService } from '../auth.service';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'nav-bar',
  providers: [
    AuthService,
    LoginService
  ],
  templateUrl: './nav.component.html',
  styleUrls: [ './nav.component.scss' ],
})
export class Nav {
  private sub: any;
  public showLoginPanel = false;

  // TypeScript public modifiers
  constructor(private _auth: AuthService, private _login: LoginService, private _router:Router) { 
     
  }

  logout() {
    this._login.logout();
  }

  getUserName() : String {
    return this._auth.getUser() ? this._auth.getUser().username : "";
  }
  
  ngOnInit() {
    this.sub = this._router.events.subscribe(e => {
        if (e instanceof NavigationEnd && e.url != '/login') {
          this.showLoginPanel = true;
        } else {
          this.showLoginPanel = false;
        }
    });
  }
  
} 
