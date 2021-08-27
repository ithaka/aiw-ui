import { DomSanitizer } from '@angular/platform-browser';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Subscription }   from 'rxjs'
import { map } from 'rxjs/operators'

// Project Dependencies
import { AssetService, AuthService, LogService, FlagService, DomUtilityService, ScriptService, TitleService, AssetSearchService } from '../_services'
import { AssetFiltersService } from '../asset-filters/asset-filters.service'
import { AssetGrid } from './../asset-grid/asset-grid.component'
import { AppConfig } from '../app.service'

@Component({
  selector: 'ang-search-page',
  providers: [],
  styleUrls: ['./search-page.component.scss'],
  templateUrl: './search-page.component.pug',
})

export class SearchPage implements OnInit, OnDestroy {

  public siteID: string = '';
  public showFilters: boolean = false;
  // Add user to decide whether to show the banner
  private user: any = this._auth.getUser();

  private subscriptions: Subscription[] = [];

  @ViewChild(AssetGrid)
  private assetGrid: AssetGrid;
  // private searchInResults: boolean = false;

  private unaffiliatedUser: boolean = false;

  private userSessionFresh: boolean = false;

  private logFilters: any = {};
  public searchTerm: string = '';
  public jstorLink: string = '';

  constructor(
        public _appConfig: AppConfig,
        private _assets: AssetService,
        private _assetSearch: AssetSearchService,
        private route: ActivatedRoute,
        private _filters: AssetFiltersService,
        private _flags: FlagService,
        private _router: Router,
        private _title: TitleService,
        public _auth: AuthService,
        private _captainsLog: LogService,
        private _script: ScriptService,
        private _dom: DomUtilityService
    ) {
      // console.log("Constructing search page 🔍")
      this.siteID = this._appConfig.config.siteID;
      // this makes the window always render scrolled to the top - a dummy window.scrollTo method created for SSR compatibility
      this._router.events.pipe(
        map(() => {
          window.scrollTo(0, 0)
        })).subscribe()
  }

  ngOnInit() {
    this._script.loadScript('ethnio-survey')

    // Subscribe User object updates
    this.subscriptions.push(
      this._auth.currentUser.subscribe(
        (userObj) => {
          this.user = userObj;
          // userSessionFresh: Do not attempt to search until we know user object is fresh
          if (!this.userSessionFresh && this._auth.userSessionFresh) {
            this.userSessionFresh = true;
            this.routeParamSubscrpt()
          }
        },
        (err) => {
          console.error('Nav failed to load Institution information', err);
        }
      ),
      // Post search info to Captain's Log
      this._assets.searchRequestIdAvailable.pipe(map((abc) => {
        this._captainsLog.log({
          eventType: 'artstor_search',
          referring_requestid: this._assetSearch.latestSearchRequestId,
          additional_fields: {
            'searchTerm': this.searchTerm,
            'searchFilters': this.logFilters
          }
        })
      })).subscribe()
    );

  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  private routeParamSubscrpt(): void {
    this.route.params.subscribe( (routeParams) => {
      let params = Object.assign({}, routeParams);

      // if advanced search, inject search survey script
      if (params.advSearch) {
        this._script.loadScript('advanced-search-survey')
      }

      // Find feature flags applied on route
      // - Needs to be checked before running queryAll)
      this._flags.readFlags(routeParams)

      // If a page number isn't set, reset to page 1!
      if (!params['page']){
        params['page'] = 1;
      }

      // If the _auth.isPublicOnly() doesn't match the component's "unaffiliatedUser" flag then refresh search results
      let refreshSearch = this.unaffiliatedUser && this._auth.isPublicOnly() ? false : true

      // Make a search call if there is a search term or any selected filter
      if (params['term'] || params['classification'] || params['geography'] || params['collectiontypes']  || params['collTypes'] || params['startDate'] || params['endDate']) {
        // Build *reporting* search filters object
        let logFilters = Object.assign({}, params)
        // Remove search term value
        delete logFilters['term']
        this.logFilters = logFilters
        this.searchTerm = params['term']
        this.jstorLink = `https://www.jstor.org/action/doBasicSearch?Query=${this.searchTerm}&utm_source=aiw`

        this._title.setSubtitle( '"' + params['term'] + '"' )
        this._assets.queryAll(params, refreshSearch);
      } else {
        this._title.setTitle( 'Artstor' )
        console.log('No search term');
        params['term'] = '*';
        this._assets.queryAll(params, refreshSearch);
      }

      this.unaffiliatedUser = this._auth.isPublicOnly() ? true : false
    })
  }

  public skipToFilterSec(): void{
    window.setTimeout(() => {
      let htmlelement = this._dom.byId('skip-to-search-link');
      htmlelement.focus();
    }, 250);
  }

  public skipToSearchSec(): void{
    window.setTimeout(() => {
      let htmlelement = this._dom.byId('skip-to-filter-link');
      htmlelement.focus();
    }, 250);
  }

  public logNavigateToJstor(): void{
    this._captainsLog.log({
      eventType: 'jstor_search',
      referring_requestid: this._assetSearch.latestSearchRequestId,
      additional_fields: {
        'searchTerm': this.searchTerm,
        'searchFilters': this.logFilters
      }
    })
  }

  // private updateSearchInRes(value: boolean): void{
  //  this.searchInResults = value;
  // }
}
