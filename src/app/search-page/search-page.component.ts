import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'
import { Subscription }   from 'rxjs/Subscription';

import { AssetService } from './../shared/assets.service';
import { AuthService, LogService } from '../shared';
import { AssetFiltersService } from '../asset-filters/asset-filters.service';
import { AnalyticsService } from '../analytics.service';
import { AssetGrid } from './../asset-grid/asset-grid.component';
import { TitleService } from '../shared/title.service';
import { AppConfig } from '../app.service';

@Component({
  selector: 'ang-search-page',
  providers: [],
  styleUrls: ['./search-page.component.scss'],
  templateUrl: './search-page.component.pug',
})

export class SearchPage implements OnInit, OnDestroy {
  // Add user to decide whether to show the banner
  private user: any = this._auth.getUser(); 

  private unaffiliatedFlag: boolean;
  private siteID: string = ""

  private subscriptions: Subscription[] = [];

  @ViewChild(AssetGrid)
  private assetGrid: AssetGrid;
  // private searchInResults: boolean = false;

  constructor(
        public _appConfig: AppConfig,
        private _assets: AssetService,
        private route: ActivatedRoute,
        private _filters: AssetFiltersService,
        private _router: Router,
        private _analytics: AnalyticsService,
        private _title: TitleService,
        private _auth: AuthService,
        private _captainsLog: LogService
      ) {
    this.siteID = this._appConfig.config.siteID;
    // this makes the window always render scrolled to the top
    this._router.events.subscribe(() => {
      window.scrollTo(0, 0);
    });
  }

  ngOnInit() {
    // Subscribe User object updates
    this.subscriptions.push(
      this._auth.currentUser.subscribe(
        (userObj) => {
          this.user = userObj;
        },
        (err) => {
          console.error("Nav failed to load Institution information", err)
        }
      )
    );


    // Subscribe to term in params
    this.subscriptions.push(
      this.route.params.subscribe( (routeParams) => {
        let params = Object.assign({}, routeParams);
        // Find feature flags (needs to be checked before running queryAll)
        if(params && params['featureFlag']){
            console.log(params['featureFlag'])
            this._auth.featureFlags[params['featureFlag']] = true;
            // Check for unaffiliated user flag
            if (params['featureFlag']=="unaffiliated"){
              this.unaffiliatedFlag = true;
            }
        }

        // If a page number isn't set, reset to page 1!
        if (!params['page']){
          params['page'] = 1;
        }

        // Make a search call if there is a search term or any selected filter
        if (params["term"] || params["classification"] || params["geography"] || params["collectiontypes"]  || params["collTypes"] || params["startDate"] || params["endDate"]) {
          // Build *reporting* search filters object
          let logFilters = Object.assign({}, params)
          // Remove search term value
          delete logFilters["term"]
          // Post search info to Captain's Log
          this._captainsLog.log({
            eventType: "artstor_search",
            additional_fields: { 
              "searchTerm": params["term"],
              "searchFilters": logFilters
            }
          })

          this._title.setSubtitle( '"'+ params["term"] + '"' )
          this._assets.queryAll(params);
        } else {
          this._title.setTitle( 'Artstor' )
          console.log('No search term');
          params['term'] = '*';
          this._assets.queryAll(params);
        }
      })
    );
    this._analytics.setPageValues('search', '')
  } // OnInit

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  // private updateSearchInRes(value: boolean): void{
  //  this.searchInResults = value;
  // }
}
