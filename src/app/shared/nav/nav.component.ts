import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { LoginService } from '../../login/login.service';
import { AuthService, ToolboxService } from '..';

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
  private institutionObj: any;
  private _tool: ToolboxService = new ToolboxService();

  // TypeScript public modifiers
  constructor(private _auth: AuthService, private _login: LoginService, private _router:Router, private route: ActivatedRoute, private location: Location) {  
  }

  ngOnInit() {

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
      this._auth.getInstitution().subscribe((institutionObj) => {
        this.institutionObj = institutionObj;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  logout(): void {
    this._login.logout();
  }

  loginAndSaveRoute(): void {
    this._auth.store("stashedRoute", this.location.path(false));

    this._router.navigate(['/login']);
  }
  
} 
