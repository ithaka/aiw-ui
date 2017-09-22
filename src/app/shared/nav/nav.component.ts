import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { AuthService, AssetService, ToolboxService } from '..';
import { AppConfig } from "app/app.service";

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

  // TypeScript public modifiers
  constructor(
    public _appConfig: AppConfig, 
    private _auth: AuthService,
    private _assets: AssetService,
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
            // Get institutional information if showing user info
            this.getInstitutionalInfo()
        } else {
            this.showLoginPanel = false;
        }
        this.user = this._auth.getUser();
      })
    );

    // Show inactive user logout modal once the subject is set by auth.service
    this.subscriptions.push(
      this._auth.showUserInactiveModal.subscribe( value => {
        this.showinactiveUserLogoutModal = value;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  /**
   * Loads User or IP auth information, and updates the appropriate objects
   */
  getInstitutionalInfo() {
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

    // Trigger call to get fresh institutional information
    this._assets.getUserInstitution()
      .then((data) => {
        // Got institutional info
      })
      .catch((err) => {
        console.log(err)
      })
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
        console.log(err)
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
