import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { LoginService } from '../../login/login.service';
import { AuthService, AssetService, ToolboxService } from '..';

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
  private user: any = {};
  private institutionObj: any = {};
  private _tool: ToolboxService = new ToolboxService();
  
  private showinactiveUserLogoutModal: boolean = false;

  // TypeScript public modifiers
  constructor(
    private _auth: AuthService,
    private _assets: AssetService,
    private _login: LoginService,
    private _router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) { 

  }

  ngOnInit() {

    this.subscriptions.push(
      this._router.events.subscribe(e => {
        if (e instanceof NavigationEnd && (e.url != '/login') && (e.url.split('/')[1] != 'printpreview') && (e.url.split('/')[1] != 'assetprint')) {
            this.showLoginPanel = true;
        } else {
            this.showLoginPanel = false;
        }
        this.user = this._auth.getUser();
      })
    );

    this.subscriptions.push(
      this._auth.getInstitution().subscribe(
        (institutionObj) => {
          this.institutionObj = institutionObj;
        },
        (err) => {
          console.log("Nav failed to load Institution information", err)
        }
      )
    );

    // Show inactive user logout modal once the subject is set by auth.service
    this.subscriptions.push(
      this._auth.showUserInactiveModal.subscribe( value => {
        this.showinactiveUserLogoutModal = value;
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

  // Reset the idle watcher and navigate to remote login page
  inactiveUsrLogOut(): void{
    this._auth.resetIdleWatcher();
    this.showinactiveUserLogoutModal = false;
  }
  
} 
