import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { Subscription }   from 'rxjs/Subscription';

import { AssetService } from '../shared/assets.service';
import { AssetFiltersService } from '../asset-filters/asset-filters.service';

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
  private results = [];
  filters = [];
  private knownFilters: any = {};
  /**
   * urlParams is used as an enum for special parameters
   */
  private urlParams: any = {
    term: "",
    pageSize: 24,
    totalPages: 1,
    currentPage: 1,
    startDate: "",
    endDate: "",
    igId: "",
    objectId: "",
    colId: ""
  };
  collTypeFacets = [];
  classificationFacets = [];
  geoTree = [];
  geographyFacets = [];
  dateFacetsArray = [];
  dateFacet = {
    earliest : {
      date : 1000,
      era : 'BCE'
    },
    latest : {
      date : 2016,
      era : 'CE'
    },
    modified : false
  };
  
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

          this._filters.setFacets('dateObj', this.dateFacet);
        }

        //loop through url matrix parameters
        for (let param in params) {
          //test if param is a special parameter
          if (this.urlParams.hasOwnProperty(param)) {
            //param is a special parameter - assign the value
            this.urlParams[param] = params[param];
          } else {
            //param is (likely) a filter (or I messed up) - add it to knownFilters
            this.knownFilters[param] = params[param];
            this.toggleFilter(param, this.knownFilters[param]);
          }
        }
        
        //only searching currently takes place in asset-grid, and should be moved to asset.service
        if(this.urlParams.term) {
          this.getTermsList();
          this.loadSearch(this.urlParams.term);
        }
      })
    );

    // sets up subscription to allResults, which is the service providing thumbnails
    this.subscriptions.push(
      this._assets.allResults.subscribe((allResults: any[]) => {
        this.results = allResults;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  getTermsList(){
    this._assets.termList()
      .then((res) => {
        this.geoTree = res.geoTree;
      })
      .catch((err) => {
        console.log('Unable to load terms list.');
        console.log(err);
      });
  }

  /**
   * Executes searchn and sets relevant asset-grid parameters
   */
  loadSearch(term) {
    if (!term && this.results === []) {
      let term = "*";
    }
    this.searchLoading = true;

    this._assets.search(term, this.filters, this.activeSort.index, this.pagination, this.dateFacet)
      .then(
        data => {
          console.log(data);
          this.generateColTypeFacets( this.getUniqueColTypeIds(data.collTypeFacets) );
          this.generateGeoFacets( data.geographyFacets );
          this.generateDateFacets( data.dateFacets );
          this._filters.setFacets('classification', data.classificationFacets);
          this.urlParams.totalPages = this.setTotalPages(data.count);
          this.results = data.thumbnails;
          this.searchLoading = false;
      })
      .catch(function(err) {
        // this.errors['search'] = "Unable to load search.";
        this.searchLoading = false;
      });
  }

  goToPage(pageNum: number) {
    if (this.urlParams.currentPage !== pageNum) {
      // this shouldn't be done here...
      // this.urlParams.currentPage = pageNum;

      let currentParamsArr: Params = this.route.snapshot.params;
      let currentParamsObj: any = { };
      for (let param in currentParamsArr) {
        currentParamsObj[param] = currentParamsArr[param];
      }
      currentParamsObj.currentPage = +pageNum;

      this._router.navigate([currentParamsObj], { relativeTo: this.route });
    }
  }

  /**
   * Sets the number of total pages in pagination
   * @param count The total number of images in results
   * @returns the total number of pages the assets will fill
   */
  setTotalPages(count){
     return Math.ceil( count / this.urlParams.pageSize );
  }

  changeSortOpt(index, label) {
    this.activeSort.index = index;
    this.activeSort.label = label; 
    this.urlParams.currentPage = 1;
    
  }

  changePageSize(pageSize: number){
    this.urlParams.pageSize = pageSize;
    this.urlParams.currentPage = 1;
    
    let currentParamsArr: Params = this.route.snapshot.params;
    let currentParamsObj: any = { };
    for (let param in currentParamsArr) {
      currentParamsObj[param] = currentParamsArr[param];
    }
    currentParamsObj.pageSize = +pageSize;

    this._router.navigate([currentParamsObj], { relativeTo: this.route }); //good, but ditches existing params
  }

  toggleEra(dateObj){
    if(dateObj.era == 'BCE'){
      dateObj.era = 'CE';
    }
    else{
      dateObj.era = 'BCE';
    }
  }

  toggleFilter(value, group){
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

    this.urlParams.currentPage = 1;
    
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
      this.dateFacet.modified = false;
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
    
    this.urlParams.currentPage = 1;
    
  }

  removeFilter(filterObj){
    for(var i = 0; i < this.filters.length; i++){
      var filter = this.filters[i];
      if((filterObj.filterGroup === filter.filterGroup) && (filterObj.filterValue === filter.filterValue)){
        this.filters.splice(i, 1);
        break;
      }
    }
  }
  
  filterExists(filterObj){
    console.log("original filter object");
    console.log(filterObj);
    for(var i = 0; i < this.filters.length; i++){
      var filter = this.filters[i];
      console.log(filter);
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

  generateColTypeFacets(idsArray){
    var generatedFacetsArray = [];
    for(var i = 0; i < idsArray.length; i++){
      var facetObj = {
        id : idsArray[i],
        label: ''
      };
      if(facetObj.id === '1'){
        facetObj.label = 'Artstor Digital Library';
      }
      else if(facetObj.id === '5'){
        facetObj.label = 'Shared Shelf Commons';
      }
      generatedFacetsArray.push(facetObj);
    }
    
    this.collTypeFacets = generatedFacetsArray;
    this._filters.setFacets('collType', generatedFacetsArray); 
  }

  generateGeoFacets(resGeoFacetsArray){
    var generatedGeoFacets = [];
    var countriesArray = [];
    // Extract Regions
    for(var i = 0; i < resGeoFacetsArray.length; i++){
      var resGeoFacet = resGeoFacetsArray[i];
      var match = false;

      for(var j = 0; j < this.geoTree.length; j++){
        var geoTreeObj = this.geoTree[j];
        if((geoTreeObj.type == 'region') && (resGeoFacet.id == geoTreeObj.nodeId)){
          resGeoFacet.expanded = false;
          resGeoFacet.childrenIds = geoTreeObj.children;
          resGeoFacet.children = [];
          match = true;
          break;
        }
      }

      if(match){
          generatedGeoFacets.push(resGeoFacet);
      }
      else{
          countriesArray.push(resGeoFacet);
      }

    }

    // console.log(countriesArray);

    // Extract Countries
    for(var i = 0; i < countriesArray.length; i++){
      var country = countriesArray[i];

      for(var j = 0; j < generatedGeoFacets.length; j++){
        var generatedGeoFacet = generatedGeoFacets[j];
        if(this.existsInRegion(country.id, generatedGeoFacet.childrenIds)){
          // country.parentId = generatedGeoFacet.id;
          generatedGeoFacet.children.push(country);
          break;
        }
      }

    }


    this._filters.setFacets('geography', generatedGeoFacets);
    this.geographyFacets = generatedGeoFacets;
  }

  generateDateFacets(dateFacetsArray){
    var startDate = dateFacetsArray[0].date;
    var endDate = dateFacetsArray[dateFacetsArray.length - 1].date;
    
    this.dateFacet.earliest.date = Math.abs(startDate);
    this.dateFacet.earliest.era = startDate < 0 ? "BCE" : "CE";

    this.dateFacet.latest.date = Math.abs(endDate);
    this.dateFacet.latest.era = endDate < 0 ? "BCE" : "CE";

    this.dateFacet.modified = false;

    this._filters.setFacets('date', dateFacetsArray);
    this._filters.setFacets('dateObj', this.dateFacet);
    this.dateFacetsArray = dateFacetsArray;
  }

  applyDateFilter(){
    this.dateFacet.modified = true;

    this.urlParams.currentPage = 1;
    
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


}
