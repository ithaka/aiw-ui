import { Component, OnInit, OnDestroy } from '@angular/core'
import { Router } from '@angular/router'
import { Subscription } from 'rxjs'
import { map } from 'rxjs/operators'
import { DeviceDetectorModule, DeviceDetectorService } from 'ngx-device-detector'

import { AssetService, AuthService, ScriptService } from '../shared'
import { AppConfig } from '../app.service'
import { Featured } from './featured'

declare var initPath: string

@Component({
  // The selector is what angular internally uses
  // for `document.querySelectorAll(selector)` in our index.html
  // where, in this case, selector is the string 'home'
  selector: 'home',  // <home></home>
  // Our list of styles in our component. We may add more to compose many styles together
  styleUrls: ['./home.component.scss'],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  templateUrl: './home.component.pug'
})
export class Home implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = []

  private artStorEmailLink: string = ''
  private userGeoIP: any = {}

  // Set our default values
  localState = { value: '' }
  collections = []
  instCollections = []
  institution: any = {}
  errors = {}
  loaders = {}
  private user: any
  private blogPosts: any[] = []
  private blogLoading: boolean = true

  public showBlog: boolean = false
  private showPrivateCollections: boolean = false
  private browseSec: any = {}
  private showHomeSSC: boolean = false
  public showHomePromo: boolean = false
  public siteID: string = ''

  // Default IG 'Browse By:' Option controlled via the WLV file
  private defaultGrpBrwseBy: string = 'institution'

  // TypeScript public modifiers
  constructor(
    public _appConfig: AppConfig,
    private _assets: AssetService,
    private _router: Router,
    public _auth: AuthService,
    private deviceService: DeviceDetectorService,
    private _script: ScriptService
  ) {
    // this makes the window always render scrolled to the top
    this._router.events.pipe(
      map(() => {
        window.scrollTo(0, 0);
      }
    )).subscribe()

    this.showBlog = this._appConfig.config.showHomeBlog
    this.showPrivateCollections = this._appConfig.config.browseOptions.myCol
    this.browseSec = this._appConfig.config.homeBrowseSec
    this.showHomeSSC = this._appConfig.config.showHomeSSC
    this.showHomePromo = this._appConfig.config.showHomeAd
    this.siteID = this._appConfig.config.siteID
    this.defaultGrpBrwseBy = this._appConfig.config.defaultGrpBrwseBy
  }

  ngOnInit() {

    // Provide redirects for initPath detected in index.html from inital load
    if (initPath) {
      this._router.navigateByUrl(initPath)
        .then(result => {
          // Clear variable to prevent further redirects
          initPath = null
          console.log('Redirect to initial path attempt: ' + result)
        })
    }

    this.user = this._auth.getUser();

    this.subscriptions.push(
      this._auth.getInstitution().pipe(
        map(institutionObj => {
          this.institution = institutionObj
        }
      )).subscribe()
    )

    this.loaders['collections'] = true;
    this.loaders['instCollections'] = true;

    /*
     * Subscribe to user object
     * and fetch collections list only after we have the user object returned
     */
    this.subscriptions.push(
      this._auth.currentUser.pipe(
        map(userObj => {
          if (userObj.institutionId && (this.instCollections.length === 0)) {

            this.subscriptions.push(this._assets.getCollectionsList().pipe(
                map(data => {
                  // Filter SSC content
                  this.collections = data['Collections'].filter((collection) => {
                    return collection.collectionType == 5
                  })
                  this.loaders['collections'] = false;
                  // Filter institutional content
                  this.instCollections = data['Collections'].filter((collection) => {
                    return collection.collectionType == 2 || collection.collectionType == 4
                  })
                  this.loaders['instCollections'] = false;
                },
                err => {
                  if (err && err.status != 401 && err.status != 403) {
                    console.error('Failed to load collection list', err)
                  }
                }
              )).subscribe()
            ) // end push
          }
        },
        err => {
          console.error('Failed to load user object', err)
        }
      )).subscribe()
    ) // end push

    this._assets.getBlogEntries()
      .then((data) => {
        if (data['posts']) {
          this.blogPosts = data['posts'];
        }
        this.blogLoading = false;
      } )
      .catch((error) => {
        console.log(error);
        this.blogLoading = false;
      });

    // Set session info for Email Artstor link
    this.fetchDeviceInfo();

  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  private fetchDeviceInfo(): void {
    // Detect if adblocker is enabled or not
    let adBlockEnabled = false;
    let testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbox';
    document.body.appendChild(testAd);
    setTimeout(
      () => {
        if (testAd.offsetHeight === 0) {
          adBlockEnabled = true;
        }
        testAd.remove();

        // Fetch device info
        let deviceInfo = this.deviceService

        // Construct content Artstor email
        let deviceInfoHTML = 'Session Info \n ';
        deviceInfoHTML += 'Operating System: ' + deviceInfo.os + ' - ' + deviceInfo.os_version + ' \n ';
        deviceInfoHTML += 'Browser: ' + deviceInfo.browser + ' - ' + deviceInfo.browser_version + ' \n ';
        deviceInfoHTML += 'User Agent: ' + deviceInfo.userAgent + ' \n ';
        deviceInfoHTML += 'Screen Resolution: ' + window.screen.width + ' * ' + window.screen.height + ' \n ';
        deviceInfoHTML += 'Absolute Path: ' + window.location.href + ' \n ';
        deviceInfoHTML += 'Adblocker Enabled: ' + adBlockEnabled + ' \n ';
        deviceInfoHTML += '\n ------------------------------------------------------------------------------ \n';
        this.artStorEmailLink = 'mailto:userservices@artstor.org?body=' + encodeURIComponent(deviceInfoHTML);

      }, 100);

  }
}
