import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Subscription }   from 'rxjs'
import { map } from 'rxjs/operators'

import { AssetService } from './../shared/assets.service'
import { AuthService, LogService, FlagService, ScriptService } from '../shared'
import { AssetFiltersService } from '../asset-filters/asset-filters.service'
import { AssetGrid } from './../asset-grid/asset-grid.component'
import { TitleService } from '../shared/title.service'
import { AppConfig } from '../app.service'

@Component({
  selector: 'ang-search-page',
  providers: [],
  styleUrls: ['./search-page.component.scss'],
  templateUrl: './search-page.component.pug',
})

export class SearchPage implements OnInit, OnDestroy {

  public siteID: string = ''
  // Add user to decide whether to show the banner
  private user: any = this._auth.getUser();

  private subscriptions: Subscription[] = [];

  @ViewChild(AssetGrid)
  private assetGrid: AssetGrid;
  // private searchInResults: boolean = false;

  private unaffiliatedUser: boolean = false;

  private userSessionFresh: boolean = false;

  constructor(
        public _appConfig: AppConfig,
        private _assets: AssetService,
        private route: ActivatedRoute,
        private _filters: AssetFiltersService,
        private _flags: FlagService,
        private _router: Router,
        private _title: TitleService,
        public _auth: AuthService,
        private _captainsLog: LogService,
        private _script: ScriptService
    ) {
      this.siteID = this._appConfig.config.siteID;
      // this makes the window always render scrolled to the top
      this._router.events.pipe(
        map(() => {
          window.scrollTo(0, 0)
        })).subscribe()
  }

  ngOnInit() {

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
      )
    );

    // Load Ethnio survey
    if (this._appConfig.config.siteID !== 'SAHARA') {
      this._script.loadScript('ethnio-survey')
    }
  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  private routeParamSubscrpt(): void {
    this.route.params.subscribe( (routeParams) => {
      let params = Object.assign({}, routeParams);

      // Find feature flags (needs to be checked before running queryAll)
      if (params && params['featureFlag']){
          this._flags[params['featureFlag']] = true;
      }

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
        // Post search info to Captain's Log
        this._captainsLog.log({
          eventType: 'artstor_search',
          additional_fields: {
            'searchTerm': params['term'],
            'searchFilters': logFilters
          }
        })

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
    window.setTimeout(function ()
    {
      // TO-DO: Only reference document client-side
      // let htmlelement: HTMLElement = document.getElementById('skip-to-search-link');
      // (<HTMLElement>htmlelement).focus();
    }, 100);
  }

  public skipToSearchSec(): void{
    window.setTimeout(function ()
    {
      // TO-DO: Only reference document client-side
      // let htmlelement: HTMLElement = document.getElementById('skip-to-filter-link');
      // (<HTMLElement>htmlelement).focus();
    }, 100);
  }

  // private updateSearchInRes(value: boolean): void{
  //  this.searchInResults = value;
  // }
}
