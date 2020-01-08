/*
 * Angular 2 decorators and services
 */
import { Component, ViewEncapsulation, PLATFORM_ID, Inject, Renderer2 } from '@angular/core'
import { DOCUMENT } from '@angular/common'
import { Angulartics2GoogleTagManager } from 'angulartics2/gtm'
import { Title, Meta } from '@angular/platform-browser'
import { Router, NavigationStart, NavigationEnd } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { map, take } from 'rxjs/operators'

// Project Dependencies
import { AppConfig } from './app.service'
import { isPlatformBrowser } from '@angular/common'
import { DomUtilityService, FlagService, FullScreenService, ScriptService, AuthService } from '_services'
import { version } from './../../package.json'

// Server only imports
import * as enTranslation from '../assets/i18n/en.json'
import { Angulartics2 } from 'angulartics2';


const STATUS_PAGE_CMP_ID_STAGE: string = 'fck7kkc59xvh'
const STATUS_PAGE_CMP_ID_PROD: string = 'cmy3vpk5tq18'

/*
 * App Component
 * Top Level Component
 */
@Component({
  selector: 'app-root',
  encapsulation: ViewEncapsulation.None,
  template: `
    <ang-sky-banner *ngIf="showSkyBanner" [textValue]="skyBannerCopy" (closeBanner)="closeBanner()"></ang-sky-banner>
    <div>
      <div *ngIf="!_fullscreen.isFullscreen" id="skip-main-content-div" tabindex="-1">
        <button id="skip-main-content-button" (click)="findMainContent()" (keyup.enter)="findMainContent()" tabindex="1" class="sr-only sr-only-focusable"> Skip to main content </button>
      </div>
      <nav-bar tabindex="-1"></nav-bar>
      <main id="main">
        <router-outlet></router-outlet>
      </main>

      <footer></footer>
    </div>
  `
})
export class AppComponent {
  url = 'https://artstor.org/'
  title = 'Artstor'

  public showSkyBanner: boolean = false
  public skyBannerCopy: string = ''
  public test: any = {}

  public statusPageClient: any
  /**
   * Google Tag Manager variables
   * - In order of specificity
   */
  private pageNameMap = {
    '/home' : { name: 'home', section: 'home', type: 'home' },
    '/account' : { name: 'settings', section: 'account', type: 'admin' },
    '/browse/library;viewId=250' : { name: 'browse by classification', section: 'browse', type: 'browse' },
    '/browse/library;viewId=260' : { name: 'browse by geography', section: 'browse', type: 'browse' },
    '/browse/institution' : { name: 'browse by institutional', section: 'browse', type: 'browse' },
    '/browse/commons' : { name: 'browse by public', section: 'browse', type: 'browse' },
    '/browse/mycollections' : { name: 'browse my collections', section: 'browse', type: 'browse' },
    '/browse/library' : { name: 'browse by collection', section: 'browse', type: 'browse' },
    '/browse/groups' : { name: 'browse groups', section: 'groups', type: 'browse' },
    '/search' : { name: 'search', section: 'search', type: 'search' },
    '/assetprint' : { name: 'print preview item', section: 'content', type: 'content view' },
    '/asset' : { name: 'item', section: 'content', type: 'content view' },
    '/object' : { name: 'item', section: 'content', type: 'content view' },
    '/category' : { name: 'collection', section: 'content', type: 'browse' },
    '/collection' : { name: 'collection', section: 'content', type: 'browse' },
    '/cluster' : { name: 'cluster', section: 'content', type: 'browse' },
    '/group' : { name: 'group', section: 'content', type: 'browse' },
    '/associated' : { name: 'associated images', section: 'content', type: 'browse' },
    '/login' : { name: 'log in', section: 'log in', type: 'admin' },
    '/register' : { name: 'register', section: 'register', type: 'admin' },
    '/printpreview' : { name: 'print preview group', section: 'content', type: 'browse' },
  }

  // url hash which should show chat widget
  private validChatUrls: Array<string> = [
    '#/login',
    '#/browse/library',
    '#/browse/institution',
    '#/browse/mycollections',
    '#/browse/commons'
  ]

  constructor(
    public _app: AppConfig,
    public _fullscreen: FullScreenService,
    private _dom: DomUtilityService,
    private _ga: Angulartics2,
    angulartics2GoogleTagManager: Angulartics2GoogleTagManager,
    private _auth: AuthService,
    private titleService: Title,
    private _script: ScriptService,
    private _flags: FlagService,
    private router: Router,
    private translate: TranslateService,
    private meta: Meta,
    private _renderer2: Renderer2,
    @Inject(DOCUMENT) private _document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // console.info("Constructing app component")
    // Append timestamp param to dodge caching
    if (isPlatformBrowser(this.platformId)) {
      let langStr = 'en.json?version=' + version
      // Use the translate loader to pull translations client-side
      this.translate.use(langStr);
      this.translate.setDefaultLang(langStr);
      // Start GTM tracking
      angulartics2GoogleTagManager.startTracking()
    }  else {
      // Reference translation json directly server-side
      // Must be set *before* setting default
      this.translate.setTranslation('en', enTranslation, true)
      this.translate.setDefaultLang('en');
    }

    this.title = this._app.config.pageTitle


    // Adding meta OGP tags
    this.meta.addTags([
      { property: 'og:title', content: 'Artstor' },
      { property: 'og:description', content: 'The Artstor Digital Library is the most extensive image resource available for educational and scholarly use. Our collections feature visual media from leading museums, photo archives, scholars, and artists, offering many rare and important collections available nowhere else.' },
      { property: 'og:url', content: 'https://library.artstor.org/' },
      { property: 'og:image', content: '/assets/img/logo-v1-1.png' },
      { property: 'og:type', content: 'website' }
    ])

    // Set metatitle to "Artstor" except for asset page where metatitle is {{ Asset Title }}
    router.events.pipe(map(event => {
      if (event instanceof NavigationStart) {

        if (isPlatformBrowser(this.platformId)) {
          // focus on the wrapper of the "skip to main content link" everytime new page is loaded
          let mainEl = <HTMLElement>(this._dom.byId('skip-main-content-div'))
          if (!(event.url.indexOf('browse') > -1) && !(event.url.indexOf('search') > -1) && !(event.url.indexOf('asset') > -1)) // Don't set focus to skip to main content on browse pages so that we can easily go between browse levels
            mainEl.focus()
        }

        // Detect featureflag=solrmetadata and set cookie
        let routeParams = event.url.split(';')
        for (let routeParam of routeParams) {
          let key = routeParam.split('=')[0]
          let value = routeParam.split('=')[1]

          if (key === 'featureFlag' && value === 'solrMetadata') {
            this._dom.setCookie('featureflag=solrmetadata')
          }
        }

        let event_url_array = event.url.split('/')
        if (event_url_array && (event_url_array.length > 1) && (event_url_array[1] !== 'asset')){
          this.titleService.setTitle(this.title)
        }
      }
      else if (event instanceof NavigationEnd) {
        if (isPlatformBrowser(this.platformId)) {
          let event_url_array = event.url.split('/')
          let path = event.urlAfterRedirects
          // Properties of "pageGTM" need to match vars set in Google Tag Manager
          let pageGTMVars = {
            'pageName' : '',
            'siteSection': '',
            'pageType' : ''
          }

          /**
           * Angulartics/Google Tag Manager
           * - Track page views with additional data in the GTM data layer
           */
          let routes = Object.keys(this.pageNameMap)
          for (let i = 0; i < routes.length; i++) {
            let route = routes[i]
            // Finding matching page values
            if (path.indexOf(route) >= 0) {
              let mapValues = this.pageNameMap[route]
              pageGTMVars = {
                'pageName': mapValues.name,
                'siteSection': mapValues.section,
                'pageType' : mapValues.type
              }
              break
            }
          }
          // Push to GTM data layer
          this._ga.eventTrack.next( { properties : {
            gtmCustom : {
              "page" : pageGTMVars
            }
          } });

          // Reset OGP tags with default values for every route other than asset and collection pages
          if (event.url.indexOf('asset/') === -1
            || event.url.indexOf('collection/') === -1
            || event.url.indexOf('category/') === -1) {
            this.resetOgpTags();
          }

          // On navigation end, load the zendesk chat widget if user lands on login page else hide the widget
          if (this.shouldShowChat(window.location.hash)) {
            this.showZendeskChat();
            this._script.loadScript('zendesk')
              .then(data => {
                window['zE'](() => {
                  window['$zopim'](() => {
                    window['$zopim'].livechat.setOnConnected(() => {
                      // Sometimes the user navigates away from a page containing the chat widget
                      // but it hasn't loaded yet. Need to check once more after it loads to ensure
                      // we still should display it.
                      if (this.shouldShowChat(window.location.hash)) {
                        this.showZendeskChat()
                      } else {
                        this.hideZendeskChat()
                      }
                    })
                  })
                });
              })
              .catch(error => console.error(error))
          } else {
            this.hideZendeskChat()
          }
        }
      }
    })).subscribe()

    this._flags.getFlagsFromService().pipe(
      take(1),
      map(flags => {
        // don't need to handle successful response here - this just initiates the flags
      }, (err) => {
        console.error(err)
    })).subscribe()
  }

  initPerimeterX() {
    let perimeterXScript = this._renderer2.createElement('script');
    perimeterXScript.id = 'px-js';
    perimeterXScript.type = `text/javascript`;
    perimeterXScript.text = `
      // Script to initialize PerimeterX
      (function(){
        window._pxAppId = 'PXTjKaL4b3';
        // Custom parameters
        // window._pxParam1 = "<param1>";
        var p = document.getElementsByTagName('script')[0],
          s = document.createElement('script');
        s.async = 1;
        s.src = '/TjKaL4b3/init.js';
        p.parentNode.insertBefore(s,p);
      }());
      `;
    this._renderer2.appendChild(this._document.head, perimeterXScript);
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Setup statusPageClient & subscribe to any status updates to show banner
      import('statuspage-client') // Load StatusPage client -side
          .then((StatusPage) => {
            this.statusPageClient = StatusPage( this._auth.getEnv() === 'test' ? STATUS_PAGE_CMP_ID_STAGE : STATUS_PAGE_CMP_ID_PROD, { environment: this._auth.getEnv() } )
            this.subscribeToStatus()
          })
    }

    this.initPerimeterX();

    this._fullscreen.addFullscreenListener()
  }

  private hideZendeskChat() {
    let zendDeskElement = this._dom.byId('launcher')
    if (zendDeskElement) {
      zendDeskElement.style.display = 'none';
    }
  }

  private showZendeskChat() {
    let zendDeskElement = this._dom.byId('launcher')
    if (zendDeskElement) {
      zendDeskElement.style.display = 'initial';
    }
  }

  /**
   * Subscribes to StatusPage.io incident/banner updates
   */
  private subscribeToStatus(): void {
    // Note: NOT an Observable, just a function
    this.statusPageClient.subscribe( (error, data) => {
      if (error) {
        console.error('Error fetching AIW Banner status updates ', error)
      } else {
        let bannerClosed: boolean = this._auth.getFromStorage('bannerClosed')
        if(data.status && data.status !== 'resolved' && !bannerClosed) {
          this.showSkyBanner = true
          this.skyBannerCopy = data.body
        } else {
          this.showSkyBanner = false
        }
      }
    })
  }

  ngOnDestroy() {
    // Unsubscribe to status updates
    this.statusPageClient && this.statusPageClient.unsubscribe()
  }

  // Close banner and save the action in local storage
  private closeBanner(): void {
    this._auth.store('bannerClosed', true)
    this.showSkyBanner = false
  }

  public findMainContent(): void {
    setTimeout(() =>
    {
      let htmlelement: HTMLElement = this._dom.byId('mainContent');
      let element: Element;

      // On search page go to the start of filter section
      if (this.router.url.indexOf('search') > -1){
        element = document.getElementById('skip-to-search-link');
      }
      // On group browse page go to the start of filter groups & tags section
      else if (this.router.url.indexOf('browse/groups') > -1){
        element = document.getElementById('skip-to-groups-link');
      }
      // On asset page, go to first button
      else if (this.router.url.indexOf('asset') > -1){
        element = document.querySelector('.btn-row button');
      }
      // On log in page, go to log in box
      else if (htmlelement.querySelector('form div input')){
        element = htmlelement.querySelector('form div input');
      }
      // On any page that has search bar, go to search box
      else if (htmlelement.querySelector('div input')){
        element = htmlelement.querySelector('div input');
      }
      // On asset page, go to the container that contains the item details
      else {
        element = htmlelement;
      }
      (<HTMLElement>element).focus();
    }, 100);
  }

  private resetOgpTags(): void{
    this.meta.updateTag({ property: 'og:title', content: 'Artstor' }, 'property="og:title"')
    this.meta.updateTag({ property: 'og:description', content: 'The Artstor Digital Library is the most extensive image resource available for educational and scholarly use. Our collections feature visual media from leading museums, photo archives, scholars, and artists, offering many rare and important collections available nowhere else.' }, 'property="og:description"')
    this.meta.updateTag({ property: 'og:url', content: 'https://library.artstor.org/' }, 'property="og:url"')
    this.meta.updateTag({ property: 'og:image', content: '/assets/img/logo-v1-1.png' }, 'property="og:image"')
  }

  // Show the chat widget on: '#/login', '#/browse/library', etc,...
  private shouldShowChat(eventUrl: string): boolean {
    return (this._app.config.showZendeskWidget && this.validChatUrls.includes(eventUrl));
  }
}
