import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router'
import { Subscription } from 'rxjs/Subscription';

import { AppState } from '../app.service'; 
import { AssetService } from '../shared/assets.service';
import { AssetFiltersService } from '../asset-filters/asset-filters.service';

@Component({
  selector: 'ang-asset-filters', 
  providers: [
    AssetService
  ],
  styleUrls: [ './asset-filters.component.scss' ],
  templateUrl: './asset-filters.component.html'
})
export class AssetFilters {
  // Set our default values
  public searchLoading: boolean;
  public showFilters: boolean = true;
  public showAdvancedModal: boolean = false;
  private subscriptions: Subscription[] = [];

  errors = {};
  results = [];
  appliedFilters = [];
  availableFilters: any = {};

  // collTypeFacets = [];
  // classificationFacets = [];
  geoTree = [];
  // geographyFacets = [];
  
  pagination = {
    currentPage : 1,
    totalPages : 1,
    pageSize : 24
  };
  activeSort = {
    index : 0,
    label : 'Relevance'
  };
  term; 
  // TO-DO: Fields should be pulled dynamically!
  public fields = [
    {name: 'Title' },
    {name: 'Creator' },
    {name: 'Location' },
    {name: 'Repository' }
  ];
  
  public geographyFields = [ ];

  public advQueryTemplate = { term: '' };

  public advanceQueries = [
    { term: ''},
    { term: ''}
  ];

  private dateError: boolean = false; 

  // TypeScript public modifiers
  constructor(
      public appState: AppState, 
      private _assets: AssetService,
      private _filters: AssetFiltersService,
      private route: ActivatedRoute, 
      private router: Router) {
   
   
   
  }


  ngOnInit() {

    // Read filters from URL
    this.subscriptions.push(
      this.route.params.subscribe((routeParams) => {
        this.term = routeParams["term"];

        // When params are adjusted, applied filters need to be cleared
        this._filters.clearApplied();

        for (let paramName in routeParams) {
            if (this._filters.isFilterGroup(paramName)) {
              this._filters.apply({
                filterGroup: paramName,
                filterValue: routeParams[paramName]
              });
            }
        }
      })
    ); 
    
    // Keep an eye for available filter updates 
    this.subscriptions.push(
      this._filters.available$.subscribe(
        filters => { 
          this.availableFilters = filters; 
        }
      )
    );
    // Subscribe to all applied filters in case something fires outside this component
    this.subscriptions.push(
      this._filters.applied$
            .subscribe(filters => { 
                this.appliedFilters = filters;
                this.loadRoute();
               })
    );
   
  }

  private loadRoute() {
    let params = {};

    if (this.availableFilters.dateObj && this.availableFilters.dateObj.modified == true) {
      params['startDate'] = this.availableFilters.dateObj.earliest.date * (this.availableFilters.dateObj.earliest.era == 'BCE' ? -1 : 1);
      params['endDate'] = this.availableFilters.dateObj.latest.date * (this.availableFilters.dateObj.latest.era == 'BCE' ? -1 : 1);
    }

    for (let filter of this.appliedFilters) {
      params[filter.filterGroup] =  filter.filterValue;
    }

    this.router.navigate(['search', this.term, params]);
  }


  changeSortOpt(index, label) {
    this.activeSort.index = index;
    this.activeSort.label = label; 
    this.pagination.currentPage = 1;
    this.loadRoute();
  }

  currentPageOnblurr(){
    this.loadRoute();
  }

  toggleEra(dateObj){
    if(dateObj.era == 'BCE'){
      dateObj.era = 'CE';
    }
    else{
      dateObj.era = 'BCE';
    }
  }

  toggleTree(geoFacet){
    if(geoFacet.expanded){
      geoFacet.expanded = false;
    }
    else{
      geoFacet.expanded = true;
    } 

  }

  toggleFilter(value, group){

    // this._filters.setFilter( group, value )

    var filter = {
      filterGroup : group,
      filterValue : value
    };
    if(this._filters.isApplied(filter)){ // Remove Filter
      this._filters.remove(filter);
    } else { // Add Filter
      this._filters.apply(filter);
    }
    this.pagination.currentPage = 1;
    
    // this.loadRoute();
  }

  filterApplied(value, group){
    var filter = {
      filterGroup : group,
      filterValue : value
    };
    return this._filters.isApplied(filter);
  }

  clearAllFilterGroup(group){
    if(group == 'date'){
      this.availableFilters.dateObj.modified = false;
    }
    else{
      for(var i = 0; i < this.appliedFilters.length; i++){
        var filter = this.appliedFilters[i];
        if(filter.filterGroup === group){
          this.appliedFilters.splice(i, 1);
          i = -1;
        }
      }
    }
    
    this.pagination.currentPage = 1;

    this.loadRoute();
  }

  clearDateFilter() {
    // this.availableFilters.dateObj.modified = false;
    this._filters.generateDateFacets();
  }

  removeFilter(filterObj){
    this._filters.remove(filterObj);
  } 

  getUniqueColTypeIds(facetArray){
    var colTypeIds = [];
    for(var i = 0; i < facetArray.length; i++){
      var facetObj = facetArray[i];
      var idArray = facetObj.collectionType.split(',');
      for(var j = 0; j < idArray.length; j++){
        idArray[j] = idArray[j].trim();
        if(colTypeIds.indexOf(idArray[j]) === -1){
          colTypeIds.push(idArray[j]);
        }
      }
    }
    return colTypeIds;
  } 


  applyDateFilter(){
    var sdate = parseInt(this.availableFilters.dateObj.earliest.date);
    sdate = this.availableFilters.dateObj.earliest.era == 'BCE' ? (sdate * -1) : sdate;

    var edate = parseInt(this.availableFilters.dateObj.latest.date);
    edate = this.availableFilters.dateObj.latest.era == 'BCE' ? (edate * -1) : edate;
    
    // Show error message if Start date is greater than End date
    if(sdate > edate){
      this.availableFilters.dateObj.earliest.date = this.availableFilters.prevDateObj.earliest.date;
      this.availableFilters.dateObj.earliest.era = this.availableFilters.prevDateObj.earliest.era;

      this.availableFilters.dateObj.latest.date = this.availableFilters.prevDateObj.latest.date;
      this.availableFilters.dateObj.latest.era = this.availableFilters.prevDateObj.latest.era;

      this.dateError = true;
      setTimeout(() => {
        this.dateError = false;
      }, 3000);
      console.log('End date must be greater than or equal to Start date.');
      return;
    }

    this.availableFilters.dateObj.modified = true;
    this.pagination.currentPage = 1;
    this.loadRoute();
  }

  existsInRegion(countryId, childerenIds){
    var result = false;
    for(var i = 0; i < childerenIds.length; i++){
      var child = childerenIds[i];
      if(child._reference == countryId){
        result = true;
        break;
      }
    }
    return result;
  }

  private dateKeyPress(event: any): boolean{
      if(!((event.keyCode > 95 && event.keyCode < 106)
      || (event.keyCode > 47 && event.keyCode < 58) 
      || event.keyCode == 8)) {
          return false;
      }
  }
  
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

}
