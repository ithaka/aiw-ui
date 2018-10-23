import { Component, OnInit, OnDestroy } from '@angular/core'
import { Location } from '@angular/common'
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router'
import { Subscription } from 'rxjs'
import { map } from 'rxjs/operators'
import * as Raven from 'raven-js'

import { AuthService } from '../auth.service'
import { AssetService } from '../assets.service'
import { ToolboxService } from '../toolbox.service'
import { AppConfig } from '../../app.service'

@Component({
  selector: 'nav-bar',
  templateUrl: './nav.component.pug',
  styleUrls: [ './nav.component.scss' ],
})
export class Nav implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  public showLoginPanel = false;
  public allowExpiredModal = false;
  private user: any = {};
  private institutionObj: any = {};
  private _tool: ToolboxService = new ToolboxService();

  public showinactiveUserLogoutModal: boolean = false;
  private appConfig: any

  // Display variables
  public logoUrl = ''

  private ipAuthed: boolean = false

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
      this._router.events.pipe(
        map(e => {
          /**
           * Show/Hide logic for login info
           * - Hides "login panel" in top right for certain pages
           * - Hides session expiration modal for certain pages
           */
          if (e instanceof NavigationEnd) {
            let baseRoute: string = e.url.split('/')[1].split('?')[0].split(';')[0]
            switch (baseRoute) {
              case 'assetprint':
              case 'link':
              case 'login':
              case 'register':
              case 'printpreview':
                this.showLoginPanel = false
                this.allowExpiredModal = false
                break
              default:
                this.showLoginPanel = true
                this.allowExpiredModal = true
            }
            // Allow external asset links
            if (e.url.includes('asset/external')) {
              this.allowExpiredModal = false
            }
          }
        })).subscribe()
    );

    // check every new user value to see if they're ip auth'd
    this.subscriptions.push(
      this._auth.currentUser.pipe(
        map(user => {
          if (user && user.ipAuthed == true) {
            this.ipAuthed = true
          }
        })).subscribe()
    )

    // Subscribe to User object updates
    this.subscriptions.push(
      this._auth.currentUser.pipe(
        map(userObj => {
            this.user = userObj;

            // Add user context to sentry.io errors
            if (this.user.username){
              Raven.setUserContext({
                  email: this.user.username
              })
            } else{
              Raven.setUserContext()
            }
          },
          (err) => {
            console.error('Nav failed to load Institution information', err)
          }
        )).subscribe()
    )

    // Show inactive user logout modal once the subject is set by auth.service
    this.subscriptions.push(
      this._auth.showUserInactiveModal.pipe(
        map(value => {
          this.showinactiveUserLogoutModal = value;
        })).subscribe()
    )

    // Subscribe to Institution object updates
    this.subscriptions.push(
      this._auth.getInstitution().pipe(
        map(
          (institutionObj) => {
            this.institutionObj = institutionObj;
          },
          (err) => {
            console.error('Nav failed to load Institution information', err)
          }
        )).subscribe()
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  logout(): void {
    this._auth.logout()
      .then(() => {
        if (this.location.path().indexOf('home') >= 0) {
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
    this._auth.store('stashedRoute', this.location.path(false));

    this._router.navigate([route]);
  }

  // Reset the idle watcher and navigate to remote login page
  inactiveUsrLogOut(): void{
    this._auth.resetIdleWatcher();
    this.showinactiveUserLogoutModal = false;
  }

}
