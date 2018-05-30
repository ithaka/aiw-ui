import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import * as Raven from 'raven-js';

import { AuthService, AssetService, ToolboxService } from '..';
import { AppConfig } from '../../app.service';

@Component({
  selector: 'nav-bar',
  templateUrl: './nav.component.pug',
  styleUrls: [ './nav.component.scss' ],
})
export class Nav implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  public showLoginPanel = false;
  private user: any = {};
  private institutionObj: any = {};
  private _tool: ToolboxService = new ToolboxService();
  
  private showinactiveUserLogoutModal: boolean = false;
  private appConfig: any

  // Display variables
  private logoUrl = ""

  // TypeScript public modifiers
  constructor(
    public _app: AppConfig, 
    private _auth: AuthService,
    private _assets: AssetService,
    private _router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) {
      this.logoUrl = this._app.config.logoUrl
  }

  ngOnInit() {

    this.subscriptions.push(
      this._router.events.subscribe(e => {
        if (e instanceof NavigationEnd) {
          let baseRoute: string = e.url.split('/')[1].split('?')[0].split(';')[0]
          switch(baseRoute) {
            case 'assetprint':
            case 'link':
            case 'login':
            case 'printpreview':
              this.showLoginPanel = false
              break
            default:
              this.showLoginPanel = true
          }
        }
        // if (e instanceof NavigationEnd && (e.url != '/login') && (e.url.split('/')[1] != 'printpreview') && (e.url.split('/')[1] != 'assetprint')) {
        //     this.showLoginPanel = true
        // } else {
        //     this.showLoginPanel = false
        // }
      })
    );

    // Subscribe to User object updates
    this.subscriptions.push(
      this._auth.currentUser.subscribe(
        (userObj) => {
          this.user = userObj;

          // Add user context to sentry.io errors 
          if(this.user.username){
            Raven.setUsesrContext({
                email: this.user.username
            })
          } else{
            Raven.setUserContext()
          }
        },
        (err) => {
          console.error("Nav failed to load Institution information", err)
        }
      )
    );

    // Show inactive user logout modal once the subject is set by auth.service
    this.subscriptions.push(
      this._auth.showUserInactiveModal.subscribe( value => {
        this.showinactiveUserLogoutModal = value;
      })
    );

    // Subscribe to Institution object updates
    this.subscriptions.push(
      this._auth.getInstitution().subscribe(
        (institutionObj) => {
          this.institutionObj = institutionObj;
        },
        (err) => {
          console.error("Nav failed to load Institution information", err)
        }
      )
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  logout(): void {
    this._auth.logout()
      .then(() => {
        if (this.location.path().indexOf("home") >= 0) {
          location.reload() // this will reload the app and give the user a feeling they actually logged out
        } else {
          this._router.navigate(['/home'])
        }
      })
      .catch((err) => {
        console.error(err)
      })
  }

  navigateAndSaveRoute(route: string): void {
    this._auth.store("stashedRoute", this.location.path(false));

    this._router.navigate([route]);
  }

  // Reset the idle watcher and navigate to remote login page
  inactiveUsrLogOut(): void{
    this._auth.resetIdleWatcher();
    this.showinactiveUserLogoutModal = false;
  }
  
} 
