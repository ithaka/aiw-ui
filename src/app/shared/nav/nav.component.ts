import { Component, OnInit, OnDestroy } from '@angular/core';

import { LoginService } from '../../login/login.service';
import { AuthService } from '../auth.service';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'nav-bar',
  providers: [
    LoginService
  ],
  templateUrl: './nav.component.html',
  styleUrls: [ './nav.component.scss' ],
})
export class Nav implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  public showLoginPanel = false;
  private user: any;
  private institution: string = '';

  // TypeScript public modifiers
  constructor(private _auth: AuthService, private _login: LoginService, private _router:Router) {  
  }

  ngOnInit() {

    console.log("nav init");

    this.subscriptions.push(
      this._router.events.subscribe(e => {
        if (e instanceof NavigationEnd && (e.url != '/login') && (e.url.split('/')[1] != 'printpreview')) {
            this.showLoginPanel = true;
          } else {
            this.showLoginPanel = false;
          }
        this.user = this._auth.getUser();
      })
    );

    this.subscriptions.push(
      this._auth.getInstitution().subscribe((institution) => {
        console.log("got institution in nav:", institution);
        this.institution = institution;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  logout() {
    this._login.logout();
  }
  
} 
