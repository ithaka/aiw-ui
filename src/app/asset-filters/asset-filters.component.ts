import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router'
import { Subscription } from 'rxjs/Subscription';

import { AppState } from '../app.service'; 
import { AssetService } from '../home/assets.service';
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
  filters = [];
  facets: any = {};

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

  // TypeScript public modifiers
  constructor(
      public appState: AppState, 
      private _assets: AssetService,
      private _filters: AssetFiltersService,
      private route: ActivatedRoute, 
      private router: Router) {
   
   
    // Keep an eye for facet updates 
    this.subscriptions.push(
      _filters.facetChange$.subscribe(
        facets => { 
          console.log("Facet updated:");
          console.log(facets);
          this.facets = facets; 
        }
      )
    );
  }


  ngOnInit() {
    this.getTermsList();

    this.route.params.map(params => params['term'])
            .subscribe(term => { 
                this.term = term;
                // scope.searchAssets(term);
               });

    // Subscribe to all filter params

    // Initally set facets
    // this.filters = this._filters.getFacets();

   
  }

  getTermsList(){
    let scope = this;
    this._assets.termList()
      .then(function(res){
        scope.geoTree = res.geoTree;
        // console.log(scope);
      })
      .catch(function(err) {
        console.log('Unable to load terms list.');
      });
  }

  private loadRoute() {
    let params = { 'term' : this.term };

    if (this.facets.dateObj && this.facets.dateObj.modified == true) {
      params['startDate'] = this.facets.dateObj.earliest.date * (this.facets.dateObj.earliest.era == 'BCE' ? -1 : 1);
      params['endDate'] = this.facets.dateObj.latest.date * (this.facets.dateObj.latest.era == 'BCE' ? -1 : 1);
    }

    for (let filter of this.filters) {
      params[filter.filterGroup] =  filter.filterValue;
    }

    this.router.navigate(['search', params ]);
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
    if(this.filterExists(filter)){ // Remove Filter
      this.removeFilter(filter);
    }
    else{ // Add Filter
      this.filters.push(filter);
    }
    
    console.log('Applied Filters:-');
    console.log(this.filters);

    this.pagination.currentPage = 1;
    
    this.loadRoute();
  }

  filterApplied(value, group){
    var filter = {
      filterGroup : group,
      filterValue : value
    };
    if(this.filterExists(filter)){
      return true;
    }
    else{
      return false;
    }
  }

  clearAllFilterGroup(group){
    if(group == 'date'){
      this.facets.dateObj.modified = false;
    }
    else{
      for(var i = 0; i < this.filters.length; i++){
        var filter = this.filters[i];
        if(filter.filterGroup === group){
          this.filters.splice(i, 1);
          i = -1;
        }
      }
    }
    
    this.pagination.currentPage = 1;

    this.loadRoute();
  }

  removeFilter(filterObj){
    for(var i = 0; i < this.filters.length; i++){
      var filter = this.filters[i];
      if((filterObj.filterGroup === filter.filterGroup) && (filterObj.filterValue === filter.filterValue)){
        this.filters.splice(i, 1);
        break;
      }
    }
    this.loadRoute();
  }
  
  filterExists(filterObj){
    for(var i = 0; i < this.filters.length; i++){
      var filter = this.filters[i];
      if((filterObj.filterGroup === filter.filterGroup) && (filterObj.filterValue === filter.filterValue)){
        return true;
      }
    }
    return false;
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
    this.facets.dateObj.modified = true;
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

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

}
