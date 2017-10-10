import { Subscription } from 'rxjs/Rx';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Angulartics2 } from 'angulartics2/dist';

// Project dependencies
import { SearchQueryUtil } from './search-query';
import { AnalyticsService } from '../../analytics.service';
import { AssetFiltersService } from './../../asset-filters/asset-filters.service';
import { AuthService, AssetService, AssetSearchService } from "app/shared";
import { AppConfig } from '../../app.service';

@Component({
  selector: 'ang-search-modal',
  templateUrl: 'search-modal.component.html',
  styleUrls: [ 'search-modal.component.scss' ]
})
export class SearchModal implements OnInit {
  @Output()
  private closeModal: EventEmitter<any> = new EventEmitter();

  public fields = []
  private filterNameMap: any = {}

  public geographyFields = [
    {name: 'North America'},
    {name: 'Central America and the Caribbean'},
    {name: 'South America'},
    {name: 'Europe'},
    {name: 'Africa North of the Sahara'},
    {name: 'Sub-Saharan Africa'}
  ];

  public advQueryTemplate = {
      term: '',
      field: {
            'name' : 'in any field',
            'value' : ''
          },
      operator: 'AND'
    };

  private error: any = {};
  public advanceQueries = [];
  public advanceSearchDate: any = {
    'startDate' : '',
    'startEra' : 'BCE',
    'endDate' : '',
    'endEra' : 'CE'
  }

  // legacy
  private termsList: any = {};
  // legacy
  private colTree: any = [
    {
      id: 'allART',
      name: 'Artstor Collections',
      collections: []
    },
    {
      id: 'allSSC',
      name: 'Shared Shelf Commons Collections',
      collections: []
    }
  ];
  private instName: string = ""
  private instCollections: any[] = []
  private filterSelections: any[] = []
  private subscriptions: Subscription[] = []
  private showPrivateCollections = false

  // Filters
  private availableFilters: any[] = []

  // Search query trasnformation logic is abstracted to a utility
  private queryUtil: SearchQueryUtil = new SearchQueryUtil()

  // Flag while transitioning to Solr search
  private hideLegacyFilters: boolean
  private loadingFilters: boolean

  constructor(
        private _appConfig: AppConfig,
        private _assets: AssetService,
        private _search: AssetSearchService,
        private _filters: AssetFiltersService,
        private _router: Router,
        private route: ActivatedRoute,
        private _analytics: AnalyticsService,
        private angulartics: Angulartics2,
        private _auth: AuthService,
        // Solr Search service
        private _assetSearch: AssetSearchService,
        private _assetFilters: AssetFiltersService
      ) {

    // Setup two query fields
    this.advanceQueries.push(Object.assign({}, this.advQueryTemplate));
    this.advanceQueries.push(Object.assign({}, this.advQueryTemplate));
    this.showPrivateCollections = this._appConfig.config.browseOptions.myCol;
  }

  ngOnInit() {
    this.filterNameMap = this._filters.getFilterNameMap()
    document.body.style.overflow = 'hidden';

    this.fields = this._search.filterFields
    this.hideLegacyFilters = true
    this.loadingFilters = true
    this.loadFilters()
  }

  /**
   * Load filters (Geo, Collection, Collection Type)
   */
  private loadFilters() : void {
    this._assetSearch.getFacets().take(1)
      .subscribe(data => {

        // Process through "facets"
        for (let facetKey in data['facets']) {
          const facet = data['facets'][facetKey]

          // Prune any facets not available to the user (ex. Private Collections on SAHARA)
          for (let i = facet.values.length - 1; i >= 0; i--){
            if (!this.showPrivateCollections && facet.values[i].name.match(/3|6/)) { // NOTE: 3 & 6 are Private Collections names
              facet.values.splice(i, 1)
            }
          }

          this.availableFilters.push(facet)
        }
        // Process "hierarchies2"
        for (let hierFacet in data['hierarchies2']) {
          let topObj = this._assetFilters.generateHierFacets(data['hierarchies2'][hierFacet].children, 'geography')
          this.availableFilters.push({ name: "geography", values: topObj })
        }
        this.loadingFilters = false
      })
  }

  /**
   * Depracated once new search launches
   */
  private legacyLoadFilters() : void {
    // Get GeoTree and Classifications
    this._assets.loadTermList( )
          .then((res) => {
              console.log(res);
              this.termsList = res;
          })
          .catch(function(err) {
              console.error('Unable to load Terms List.');
          });

    this.subscriptions.push(
      this._auth.getInstitution().subscribe(
        (institutionObj) => {
          console.log(institutionObj)
          if (institutionObj['shortName']) {
              this.instName = institutionObj['shortName'];
          }
        },
        (err) => {
          console.log("Nav failed to load Institution information", err)
        }
      )
    );

    // Get institutional collections
    this.subscriptions.push(
      this._assets.getCollectionsList('institution')
        .subscribe(
          (data)  => {
              this.colTree.push({
                id: 'allSS',
                name: 'Institutional Collections',
                collections: data['Collections']
              });
          },
          (error) => {
            console.log(error);
          }
        )
    )

  }

  private close(): void {
    document.body.style.overflow = 'auto';
    this.closeModal.emit()
  }

  /**
   * Add query to array of field queries
   */
  private addAdvanceQuery(): void {
    this.advanceQueries.push(Object.assign({}, this.advQueryTemplate));
  }

  /**
   * Remove query from array of field queries
   */
  private clearAdvanceQuery(index): void{
    this.advanceQueries.splice(index, 1);
  }

  private toggleEra(dateEra): void{
    if(this.advanceSearchDate[dateEra] == 'BCE'){
      this.advanceSearchDate[dateEra] = 'CE';
    }
    else{
      this.advanceSearchDate[dateEra] = 'BCE';
    }
  }

  private dateKeyPress(event: any): boolean{
      if((event.key == 'ArrowUp') || (event.key == 'ArrowDown') || (event.key == 'ArrowRight') || (event.key == 'ArrowLeft') || (event.key == 'Backspace')){
        return true;
      }

      var theEvent = event || window.event;
      var key = theEvent.keyCode || theEvent.which;
      key = String.fromCharCode( key );
      var regex = /[0-9]|\./;
      if( !regex.test(key) ) {
        theEvent.returnValue = false;
        if(theEvent.preventDefault) theEvent.preventDefault();
      }

      return theEvent.returnValue;
  }

  private resetFilters(): void {
    this.advanceSearchDate = {
      'startDate' : '',
      'startEra' : 'BCE',
      'endDate' : '',
      'endEra' : 'CE'
    };
    this.advanceQueries = [];
     // Set up two query fields
    this.advanceQueries.push(Object.assign({}, this.advQueryTemplate));
    this.advanceQueries.push(Object.assign({}, this.advQueryTemplate));

    // Clear selected filters
    this.filterSelections = [];

    // Clear checkbox UI
    let checkboxes: Array<any> = Array.from( document.querySelectorAll("#advancedModal input[type='checkbox']") );
    checkboxes.forEach(field => {
      field.checked = false;
    });
  }

  /**
   * Simple validation to test if the form is empty (This form is structured oddly, so it's simpler to do our own minimum validation)
   */
  private validateForm(): boolean {
    let isValid = false;

    let startDate = 0;
    let endDate = 0;
    if (this.advanceSearchDate['startDate'] && this.advanceSearchDate['endDate']) {
      startDate = this.advanceSearchDate['startDate'] * (this.advanceSearchDate['startEra'] == 'BCE' ? -1 : 1);
      endDate = this.advanceSearchDate['endDate'] * (this.advanceSearchDate['endEra'] == 'BCE' ? -1 : 1);
    }

    if (this.filterSelections.length < 1 && this.advanceQueries[0].term.length < 1 && this.advanceSearchDate['startDate'].length < 1 && this.advanceSearchDate['endDate'].length < 1 ) {
      // Nothing was selected! Tell the user to select something
      this.error.empty = true;
      this.error.date = false;
    }
    else if(startDate > endDate){
      // Start Date is greater than End Date
      this.error.date = true;
      this.error.empty = false;
    }
    else {
      this.error.empty = false;
      this.error.date = false;
      isValid = true;
    }
    return isValid;
  }

  private applyAllFilters(): void {
    if (!this.validateForm()) {
      return;
    }

    let advQuery
    let filterParams
    let currentParams = this.route.snapshot.params

    advQuery = this.queryUtil.generateSearchQuery(this.advanceQueries)
    filterParams = this.queryUtil.generateFilters(this.filterSelections, this.advanceSearchDate)

    // Track in Adobe Analytics
    this._analytics.directCall('advanced_search');
    this.angulartics.eventTrack.next({ action: "advSearch", properties: { category: "search", label: advQuery } })

    // Maintain feature flags
    if (currentParams['featureFlag']) {
      filterParams['featureFlag'] = currentParams['featureFlag']
    }

    // Open search page with new query
    this._router.navigate(['/search', advQuery, filterParams]);

    // Close advance search modal
    this.close();
  }

  private toggleFilter(value: string, group: string): void {
    let filter = {
      'group': group,
      'value' : value
    };
    let objIndex = this.arrayObjectIndexOf(this.filterSelections, filter);

    if (objIndex < 0) {
      this.filterSelections.push(filter);
    } else {
      this.filterSelections.splice(objIndex, 1);
    }
    this.validateForm();
  }

  // Gives the index of an object in an array
  private arrayObjectIndexOf(array, searchObj): number {
    for(let i = 0; i < array.length; i++) {
        if ( (array[i].group === searchObj.group) && (array[i].value === searchObj.value) ) return i;
    }
    return -1;
  }

  /**
   * Open Help page on Advanced Search
   */
  private openHelp(): void {
    window.open('http://support.artstor.org/?article=advanced-search','Advanced Search Support','width=800,height=600');
  }
}
