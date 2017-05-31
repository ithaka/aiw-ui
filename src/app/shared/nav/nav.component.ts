import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { LoginService } from '../../login/login.service';
import { AuthService, AssetService, ToolboxService } from '..';

import {Idle, DEFAULT_INTERRUPTSOURCES} from '@ng-idle/core';
import {Keepalive} from '@ng-idle/keepalive';

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
  private showinactiveUserLogoutModal: boolean = false;
  private idleState: string = 'Not started.';

  // TypeScript public modifiers
  constructor(
    private _auth: AuthService,
    private _assets: AssetService,
    private _login: LoginService,
    private _router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private idle: Idle,
    private keepalive: Keepalive
  ) {  
    idle.setIdle(60);
    idle.setTimeout(3600);
    idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);

    idle.onIdleEnd.subscribe(() => {
      this.idleState = 'No longer idle.';
    });
    idle.onTimeout.subscribe(() => {
      if(this.user && this.user.isLoggedIn){
        this.logout();
        this.showinactiveUserLogoutModal = true;

        this.idleState = 'Timed out!';
      }
      else{
        this.resetIdleWatcher()
      }
    });
    idle.onIdleStart.subscribe(() => {
      this.idleState = 'You\'ve gone idle!';
    });
    idle.onTimeoutWarning.subscribe((countdown) => {
      this.idleState = 'You will time out in ' + countdown + ' seconds!'
    });

    this.resetIdleWatcher();
  }

  ngOnInit() {

    // If the user session has expired, then explicitly logout the user
    this._auth.getUserInfo().subscribe( userInfo => {
      if(!userInfo.status){
        this.logout();
      }
    });

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

    this._assets.getCollections("ssc")
      .then((data) => {  })
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  logout(): void {
    this._login.logout()
      .then(() => {
        if (this.location.path().indexOf("home") >= 0) {
          location.reload() // this will reload the app and give the user a feeling they actually logged out
        } else {
          this._router.navigate(['/home'])
        }
      })
  }

  navigateAndSaveRoute(route: string): void {
    this._auth.store("stashedRoute", this.location.path(false));

    this._router.navigate([route]);
  }

  // Reset the idle watcher
  resetIdleWatcher() {
    this.idle.watch();
    this.idleState = 'Idle watcher started'
  }

  // Reset the idle watcher and navigate to remote login page
  inactiveUsrLogOut(): void{
    this.resetIdleWatcher();
    this.showinactiveUserLogoutModal = false;
  }
  
} 
