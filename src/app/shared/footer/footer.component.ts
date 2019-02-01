import { Component, PLATFORM_ID, Inject } from '@angular/core'
import { Location, isPlatformBrowser } from '@angular/common'
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router'
import { Subscription } from 'rxjs'
import { map } from 'rxjs/operators'

import { AppConfig } from '../../app.service'
import { AuthService } from '../auth.service'

import { version } from '../../../../package.json'
import { environment } from 'environments/environment'

declare let google

@Component({
  selector: 'footer',
  templateUrl: './footer.component.pug',
  styleUrls: [ './footer.component.scss' ],
})
export class Footer {
  public appVersion = ''
  public currentYear
  public links: string[]
  public siteID: string = ''
  private subscriptions: Subscription[] = []
  private user: any = {}
  private browseSec: { [key: string]: boolean } = {}

  // TypeScript public modifiers
  constructor(
    public _appConfig: AppConfig,
    private location: Location,
    private _app: AppConfig,
    private _router: Router,
    public _auth: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // console.log("Constructing footer...")
    this.siteID = this._appConfig.config.siteID;
    // Get version number
    this.appVersion = version
    this.links = this._app.config.footerLinks

    if (this._auth.getEnv() !== 'test') {
      // Remove stage links
      this.links = this.links.filter((link) => { return link !== 'SAHARA_CONTRIBUTE_STAGE'})
    }
    else {
      // Remove prod links
      this.links = this.links.filter((link) => { return link !== 'SAHARA_CONTRIBUTE_PROD' })
    }

    this.browseSec = this._app.config.homeBrowseSec

    // Set current year
    this.currentYear = new Date().getFullYear()
  }


  ngOnInit() {


    // console.log('Version: ', version)
    // this.subscriptions.push(
    //   this._router.events.pipe(
    //   map(e => {
    //     if (e instanceof NavigationEnd) {
    //       this.user = this._auth.getUser()
    //       if (this._auth.isPublicOnly()) {
    //         let index: number = this.links.indexOf('SUPPORT')
    //         this.links[index] = 'SUPPORT_UNAFFILIATED'
    //       }
    //     }
    //   })).subscribe()
    // )

    // // Workaround: Make sure Google translate has loaded
    // // Client-only 
    // if (isPlatformBrowser(this.platformId)) {
    //   setTimeout(() => {
    //     if (google && google.translate && typeof(google.translate.TranslateElement) == 'function' ) {
    //       new google.translate.TranslateElement(
    //           {
    //               pageLanguage: 'en',
    //               layout: google.translate.TranslateElement && google.translate.TranslateElement.InlineLayout.SIMPLE,
    //               autoDisplay: false
    //           },
    //           'google_translate_element'
    //       )
    //     }
    //   }, 1000)
    // }

  }

  private logout(): void {
    this._auth.logout()
      .then(() => {
        if (this.location.path().indexOf('home') >= 0) {
          location.reload() // this will reload the app and give the user a feeling they actually logged out
        } else {
          this._router.navigate(['/home'])
        }
      })
  }
}
