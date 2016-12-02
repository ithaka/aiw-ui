import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { AppState } from '../app.service';

import { AssetService } from '../home/assets.service';

@Component({
  // The selector is what angular internally uses
  // for `document.querySelectorAll(selector)` in our index.html
  // where, in this case, selector is the string 'home'
  selector: 'search', 
  // We need to tell Angular's Dependency Injection which providers are in our app.
  providers: [
    AssetService
  ],
  // Our list of styles in our component. We may add more to compose many styles together
  styleUrls: [ './search.component.scss', './filters.component.scss' ],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  templateUrl: './search.component.html'
})
export class Search {
  // Set our default values
  public searchLoading: boolean;
  public showFilters: boolean = true;
  public showAdvancedModal: boolean = false;
  errors = {};
  results = [];
  filters = [];
  collTypeFacets = [];
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

  // TypeScript public modifiers
  constructor(public appState: AppState, private _assets: AssetService, private route: ActivatedRoute) {

  }

  ngOnInit() {
    console.log('hello `Search` component');
    let scope = this;

    this.route.params.map(params => params['term'])
            .subscribe(term => { 
                scope.term = term;
                scope.searchAssets(term);
               });
  }

  searchAssets(term) {
    let scope = this;
    this.searchLoading = true;
    this._assets.search(term, this.filters, this.activeSort.index, this.pagination)
      .then(function(res){
        console.log(res);
        scope.generateColTypeFacets( scope.getUniqueColTypeIds(res.collTypeFacets) );
        scope.setTotalPages(res.count);     
        scope.results = res.thumbnails;
        scope.searchLoading = false;
      })
      .catch(function(err) {
        scope.errors['search'] = "Unable to load search.";
        scope.searchLoading = false;
      });
  }

  setTotalPages(count){
    this.pagination.totalPages = Math.ceil( count / this.pagination.pageSize );
  }


  isfirstPage(){
    if(this.pagination.currentPage === 1){
      return true;
    }
    else{
      return false;
    }
  }
  isLastPage(){
    if(this.pagination.currentPage === this.pagination.totalPages){
      return true;
    }
    else{
      return false;
    }
  }

  firstPage(){
    if(this.pagination.currentPage > 1){
      this.pagination.currentPage = 1;
      this.searchAssets(this.term);
    }
  }
  lastPage(){
    if(this.pagination.currentPage < this.pagination.totalPages){
      this.pagination.currentPage = this.pagination.totalPages;
      this.searchAssets(this.term);
    }
  }
  prevPage(){
    if(this.pagination.currentPage > 1){
      this.pagination.currentPage--;
      this.searchAssets(this.term);
    }
  }
  nextPage(){
    if(this.pagination.currentPage < this.pagination.totalPages){
      this.pagination.currentPage++;
      this.searchAssets(this.term);
    }
  }

  changeSortOpt(index, label) {
    this.activeSort.index = index;
    this.activeSort.label = label; 
    this.pagination.currentPage = 1;
    this.searchAssets(this.term);
  }

  changePageSize(size){
    this.pagination.pageSize = size;
    this.pagination.currentPage = 1;
    this.searchAssets(this.term);
  }

  currentPageOnblurr(){
    this.searchAssets(this.term);
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

    this.pagination.currentPage = 1;
    this.searchAssets(this.term);
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
    for(var i = 0; i < this.filters.length; i++){
      var filter = this.filters[i];
      if(filter.filterGroup === group){
        this.filters.splice(i, 1);
      }
    }
    this.pagination.currentPage = 1;
    this.searchAssets(this.term);
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
  }
}
