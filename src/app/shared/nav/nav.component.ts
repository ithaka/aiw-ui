import { Component, OnInit, OnDestroy } from '@angular/core'
import { Location } from '@angular/common'
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router'
import { Subscription } from 'rxjs'
import { map } from 'rxjs/operators'
import * as Sentry from '@sentry/browser';

// Project Dependencies
import { AppConfig } from '../../app.service'
import { AssetService, AuthService, FlagService, Toast, ToastService, ToolboxService } from 'app/_services'
import { Angulartics2 } from "angulartics2";
import { ArtstorStorageService } from "../../../../projects/artstor-storage/src/lib/artstor-storage.service";

@Component({
  selector: 'nav-bar',
  templateUrl: './nav.component.pug',
  styleUrls: [ './nav.component.scss' ],
})
export class Nav implements OnInit, OnDestroy {
  public showLoginPanel = false;
  public allowExpiredModal = false;

  public showinactiveUserLogoutModal: boolean = false;

  // Toasts display
  public toasts: Toast[] = []

  // Display variables
  public logoUrl = ''
  private subscriptions: Subscription[] = [];
  private user: any = {};
  private institutionObj: any = {};
  private _tool: ToolboxService = new ToolboxService();
  private appConfig: any

  private ipAuthed: boolean = false
  private isFullscreen: boolean = false

  // Flag display (dev)
  public showAppliedFlags: boolean = false
  public appliedFlags: string[] = []

  public hideLoginTooltip = true;
  public loginTooltipOptions = {
    heading: 'Access content from the world\'s top museums, artists, libraries and more...',
    bodyText: 'You currently only have access to Public Collections. Log in to view hundreds of curated collections from Artstor.',
    tabIndex: 1
  };

  // TypeScript public modifiers
  constructor(
    public _app: AppConfig,
    private angulartics: Angulartics2,
    private _auth: AuthService,
    private _assets: AssetService,
    private _router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private _storage: ArtstorStorageService,
    private _toasts: ToastService,
    private _flags: FlagService
  ) {
      // console.log("Constructing nav component...")
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
        })).subscribe(),
        // Maintain user object
        this._auth.currentUser.pipe(
          map(user => {
            if (user && user.ipAuthed == true) {
              this.ipAuthed = true
            }
          })).subscribe(),
        // Feature flag subscription
        this._flags.flagUpdates.subscribe((flags) => {
          // Trigger display of flags if URL flag is used
          this.showAppliedFlags = flags.flagsAppliedByRoute
          // Get applied flag keys for display while testing
          this.appliedFlags = []
          Object.keys(flags).forEach((flagKey) => {
            if (flags[flagKey] && ['flagsAppliedByRoute', 'bannerCopy'].indexOf(flagKey) < 0) {
              this.appliedFlags.push(flagKey)
            }
          })
        })
    )

    // Subscribe to User object updates
    this.subscriptions.push(
      this._auth.currentUser.pipe(
        map(userObj => {
            this.user = userObj;

            // Add user context to sentry.io errors
            if (this.user.username){
              Sentry.configureScope((scope) => {
                scope.setUser({email: this.user.username});
              })
            } else{
              Sentry.configureScope((scope) => {
                scope.setUser({email: ''})
              });
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
        })).subscribe(),
      this._auth.getInstitution().pipe(
        map(
          (institutionObj) => {
            this.institutionObj = institutionObj;
          },
          (err) => {
            console.error('Nav failed to load Institution information', err)
          }
        )).subscribe(),
      // Toast updates subscription
      this._toasts.toastUpdates.subscribe(
        toasts => {
          this.toasts = toasts
        }
      )
    );

    this.hideLoginTooltip = !!this._storage.getSession('hideLoginTooltip');

    document.addEventListener("fullscreenchange", () => {
      this.toggleFullscreen();
    }, false);
  
    document.addEventListener("mozfullscreenchange", () => {
      this.toggleFullscreen();
    }, false);
  
    document.addEventListener("webkitfullscreenchange",() => {
      this.toggleFullscreen();
    }, false);
  
    document.addEventListener("msfullscreenchange", () => {
      this.toggleFullscreen();
    }, false);

  }

  private toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen
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

  trackLoginButtonClick() {
    this.angulartics.eventTrack.next({ properties: { event: 'New Login Button', category: 'click', label: 'loginButtonClicked' } })
  }

  closeLoginTooltip() {
    this.hideLoginTooltip = true;
    this._storage.setSession('hideLoginTooltip', this.hideLoginTooltip);
    this.angulartics.eventTrack.next({ properties: { event: 'Login Prompt', category: 'close', label: 'loginPromptClosed'  } })
  }

}
