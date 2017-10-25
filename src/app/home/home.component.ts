import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { Ng2DeviceService } from 'ng2-device-detector';

import { AssetService, AuthService, } from '../shared';
import { AnalyticsService } from '../analytics.service';
import { AppConfig } from '../app.service';

declare var initPath: string

@Component({
  // The selector is what angular internally uses
  // for `document.querySelectorAll(selector)` in our index.html
  // where, in this case, selector is the string 'home'
  selector: 'home',  // <home></home>
  // Our list of styles in our component. We may add more to compose many styles together
  styleUrls: [ './home.component.scss' ],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  templateUrl: './home.component.pug'
})
export class Home implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = []

  private artStorEmailLink: string = ''
  private userGeoIP: any = {}
  private featuredCollectionConf = ""

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

  private showBlog: boolean = false
  private showPrivateCollections: boolean = false
  private browseSec: any = {}
  private showHomeSSC: boolean = false
  private showHomeAd: boolean = false
  private siteID: string = ""

  // TypeScript public modifiers
  constructor(
      public _appConfig: AppConfig,
      private _assets: AssetService,
      private _router: Router,
      private _auth: AuthService,
      private _analytics: AnalyticsService,
      private deviceService: Ng2DeviceService
  ) {
    // this makes the window always render scrolled to the top
    this._router.events.subscribe(() => {
      window.scrollTo(0, 0);
    });

    this.showBlog = this._appConfig.config.showHomeBlog
    this.showPrivateCollections = this._appConfig.config.browseOptions.myCol
    this.featuredCollectionConf = this._appConfig.config.featuredCollection
    this.browseSec = this._appConfig.config.homeBrowseSec
    this.showHomeSSC = this._appConfig.config.showHomeSSC
    this.showHomeAd = this._appConfig.config.showHomeAd
    this.siteID = this._appConfig.config.siteID
  }

  ngOnInit() {

    // Provide redirects for initPath detected in index.html from inital load
    if (initPath) {
      this._router.navigateByUrl(initPath)
        .then( result => {
          // Clear variable to prevent further redirects
          initPath = null
          console.log('Redirect to initial path attempt: ' + result)
        })
    }

    this.user = this._auth.getUser();

    this.subscriptions
      .push(
        this._auth.getInstitution().subscribe((institutionObj) => {
          this.institution = institutionObj;
        })
      )

    this.loaders['collections'] = true;
    this.loaders['instCollections'] = true;

    this.subscriptions
      .push(
        this._assets.getCollectionsList()
          .subscribe(
            data => {
              // Filter SSC content
              this.collections = data["Collections"].filter((collection) => {
                return collection.collectionType == 5
              })
              this.loaders['collections'] = false;
              // Filter institutional content
              this.instCollections = data["Collections"].filter((collection) => {
                return collection.collectionType == 2 || collection.collectionType == 4
              })
              this.loaders['instCollections'] = false;
            }
          )
      )

      this._assets.getBlogEntries()
        .then((data) => {
          if (data.posts) {
            this.blogPosts = data.posts;
          }
          this.blogLoading = false;
        },)
        .catch((error) => {
          console.log(error);
          this.blogLoading = false;
        });

        this._analytics.setPageValues('Home', '')

        // Grab session info for Email Artstor link
        this._auth.getUserIP().subscribe( (res) => {
          if(res){
            this.userGeoIP = res;
            this.fetchDeviceInfo();
          }
        })
  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  private fetchDeviceInfo(): void{
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
        let deviceInfo = this.deviceService.getDeviceInfo();

        // Construct content Artstor email
        let deviceInfoHTML = 'Session Info \n ';
        deviceInfoHTML += 'Operating System: ' + deviceInfo.os + ' - ' + deviceInfo.os_version + ' \n ';
        deviceInfoHTML += 'Browser: ' + deviceInfo.browser + ' - ' + deviceInfo.browser_version + ' \n ';
        deviceInfoHTML += 'User Agent: ' + deviceInfo.userAgent + ' \n ';
        deviceInfoHTML += 'Screen Resolution: ' + window.screen.width + ' * ' + window.screen.height + ' \n ';
        deviceInfoHTML += 'IP Address: ' + this.userGeoIP.ip + ' \n ';
        deviceInfoHTML += 'Absolute Path: ' + window.location.href + ' \n ';
        deviceInfoHTML += 'Adblocker Enabled: ' + adBlockEnabled + ' \n ';
        deviceInfoHTML += '\n ------------------------------------------------------------------------------ \n';
        this.artStorEmailLink = 'mailto:userservices@artstor.org?body=' + encodeURIComponent(deviceInfoHTML);

      }, 100);

  }
}
