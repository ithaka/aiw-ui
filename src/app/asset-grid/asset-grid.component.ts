import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { Subscription }   from 'rxjs/Subscription';

import { AssetService } from '../shared/assets.service';
import { AssetFiltersService } from '../asset-filters/asset-filters.service';
import { Thumbnail } from './../shared';

@Component({
  // The selector is what angular internally uses
  // for `document.querySelectorAll(selector)` in our index.html
  // where, in this case, selector is the string 'home'
  selector: 'ang-asset-grid', 
  // We need to tell Angular's Dependency Injection which providers are in our app.
  providers: [],
  // Our list of styles in our component. We may add more to compose many styles together
  styleUrls: [ './asset-grid.component.scss' ],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  templateUrl: './asset-grid.component.html'
})

export class AssetGrid implements OnInit, OnDestroy {
  // Set our default values
  private subscriptions: Subscription[] = [];

  public searchLoading: boolean;
  public showFilters: boolean = true;
  public showAdvancedModal: boolean = false;
  errors = {};
  private results: Thumbnail[] = [];
  filters = [];

  // Default show as loading until results have update
  private isLoading: boolean = true;

  @Input()
  private assetCount: number;

  private pagination: any = {
    totalPages: 1,
    pageSize: 24,
    currentPage: 1
  };
  
  dateFacet = {
    earliest : {
      date : 1000,
      era : 'BCE'
    },
    latest : {
      date : 2017,
      era : 'CE'
    },
    modified : false
  };
  
  activeSort = {
    index : 0,
    label : 'Relevance'
  };
  term;
  sub;
  // TO-DO: Fields should be pulled dynamically!
  public fields = [
    {name: 'Title' },
    {name: 'Creator' },
    {name: 'Location' },
    {name: 'Repository' }
  ];
  public geographyFields = [
    {name: 'North America'},
    {name: 'Central America and the Caribbean'},
    {name: 'South America'},
    {name: 'Europe'},
    {name: 'Africa North of the Sahara'},
    {name: 'Sub-Saharan Africa'}
  ];

  public advQueryTemplate = { term: '' };

  public advanceQueries = [
    { term: ''},
    { term: ''}
  ];

  private collectionTypeMap: any = {
    1: "artstor-asset",
    2: "institution-asset",
    3: "personal-asset",
    5: "ssc-asset"
  }

  // Object Id parameter, for Clusters
  private objectId : string = ''; 
  // Collection Id parameter
  private colId : string = '';
  // Image group Id
  private igId : string = '';

  // TypeScript public modifiers
  constructor(
    private _assets: AssetService,
    private _filters: AssetFiltersService,
    private _router: Router,
    private route: ActivatedRoute
  ) {
      
  } 

  ngOnInit() {
    this.subscriptions.push(
      this.route.params
      .subscribe((params: Params) => {

        for (let param in params) {
            // test if param is a special parameter
            if (this.pagination.hasOwnProperty(param)) {
                // param is a special parameter - assign the value
                this.pagination[param] = parseInt(params[param]);
            } else {
                // Any other filters are managed by Asset Filters
            }
        }

        if (params['term']) {
          this.term = params['term'];
        }
                
        if (params['startDate'] && params['endDate']) {
          this.dateFacet.earliest.date = Math.abs(params['startDate']);
          this.dateFacet.latest.date = Math.abs(params['endDate']);

          if (params['startDate'] < 0) {
            this.dateFacet.earliest.era = "BCE";
          } else {
            this.dateFacet.earliest.era = "CE";
          }
          if (params['endDate'] < 0) {
            this.dateFacet.latest.era = "BCE";
          } else {
            this.dateFacet.latest.era = "CE";
          }

          this._filters.setAvailable('dateObj', this.dateFacet);
        }
        
        this.isLoading = true;
      })
    );

    // sets up subscription to allResults, which is the service providing thumbnails
    this.subscriptions.push(
      this._assets.allResults.subscribe((allResults: any) => {

        // this conditional because allResults from collections page does not have count of assets
        if (allResults.count) {
          this.pagination.totalPages = Math.ceil( allResults.count / this.pagination.pageSize );
        } else if (this.assetCount) {
          this.pagination.totalPages = Math.ceil( this.assetCount / this.pagination.pageSize );
        }

        // handles case when currentPage * pageSize > allResults.count
        if (
          (allResults.count === 0 && this.pagination.currentPage > 1)
          ||
          (this.pagination.currentPage > this.pagination.totalPages)
        ) {
          // this.goToPage(1);
        } else {
          this.results = allResults.thumbnails;
        }
        if (allResults.length == 0) {
          // We push an empty array when assets are old
          this.isLoading = true;
        } else {
          this.isLoading = false;
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  /**
   * Called from template when new search term is entered
   * @param term Term for desired search
   */
  private updateSearchTerm(term: string) {
    this._router.navigate(['/search', term]);
  }

  /**
   * Set currentPage in url and navigate, which triggers this._assets.queryAll() again
   * @param currentPage number of desired page
   */
  private goToPage(currentPage: number) {
    if (currentPage < 1 || currentPage > this.pagination.totalPages) { return; } // make sure the user can't go past page limits
    this.pagination.currentPage = currentPage;
    this.addRouteParam("currentPage", currentPage);
  }

  /**
   * Change size of page and go to currentPage=1
   * @param pageSize Number of assets requested on page
   */
  private changePageSize(pageSize: number){
    this.pagination.pageSize = pageSize;
    //this currently calls naviage twice through addRouteParam
    this.goToPage(1);
    this.addRouteParam("pageSize", pageSize);
  }

  private changeSortOpt(index, label) {
    this.activeSort.index = index;
    this.activeSort.label = label; 
    this.pagination.currentPage = 1;
    
  }

  /**
   * Adds a parameter to the route and navigates to new route
   * @param key Parameter you want added to route (as matrix param)
   * @param value The value of the parameter
   */
  private addRouteParam(key: string, value: any) {
    let currentParamsObj: Params = Object.assign({}, this.route.snapshot.params);
    currentParamsObj[key] = value;

    let term: string = '';
    let extractedParams = {};
    let scpObj = this;

    Object.keys(currentParamsObj).forEach(function(key) {
            if(key == 'term'){
                term = currentParamsObj[key];
            }
            else{
              if(key == 'currentPage'){
                extractedParams['pageSize'] = scpObj.pagination.pageSize;
              }
              extractedParams[key] = currentParamsObj[key];
            }
        });

    this._router.navigate([extractedParams], { relativeTo: this.route });
    // this._router.navigate(['/search', term, extractedParams]);
  }

  private convertCollectionTypes(collectionId: number) {
    switch (collectionId) {
      case 3:
        return "personal-asset";
    }
  }
}
