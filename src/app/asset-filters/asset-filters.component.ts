import { Component } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { Subscription } from 'rxjs'
import { map, take, filter } from 'rxjs/operators'
import { Angulartics2 } from 'angulartics2'

// Project Dependencies
import { AuthService, FlagService, InstitutionService } from 'app/_services'
import { AssetFiltersService } from '../asset-filters/asset-filters.service'
import { ArtstorStorageService } from '../../../projects/artstor-storage/src/public_api'

declare var _satellite: any

@Component({
  selector: 'ang-asset-filters',
  styleUrls: [ './asset-filters.component.scss' ],
  templateUrl: './asset-filters.component.pug'
})
export class AssetFilters {
  // Set our default values
  public searchLoading: boolean
  public showFilters: boolean = true
  public showAdvancedModal: boolean = false
  private subscriptions: Subscription[] = []
  private filterDate: boolean = false
  private filterNameMap: any = {}

  private userInstId: string        // user's institution id
  private instFilterCount: number   // collection type 2 filter for search results count
  private allInstFailed: boolean = false  // helper if/when call to getAllInstitutions fails

  errors = {}
  results = []
  appliedFilters = []
  availableFilters: any = {}

  // collTypeFacets = [];
  // classificationFacets = [];
  geoTree = [];
  // geographyFacets = [];

  pagination = {
    page : 1,
    totalPages : 1,
    size : 24
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

  private filters: any;

  // TypeScript public modifiers
  constructor(
    private _filters: AssetFiltersService,
    private route: ActivatedRoute,
    private router: Router,
    private angulartics: Angulartics2,
    private _auth: AuthService,
    private _flags: FlagService,
    private _inst: InstitutionService,
    private _storage: ArtstorStorageService
  ) {
  }


  ngOnInit() {

  // Get User Institution ID
  this._auth.getInstitution().pipe(
    take(1),
    map(data => {
      this.userInstId = data['institutionId']
    }, err => {
      console.log(err.status)
  })).subscribe()

    this._inst.getAllInstitutions().pipe(
      take(1),
      map(data => {
        if (this._storage.getSession('allInstitutions') === 'undefined') {
          this._storage.setSession('allInstitutions', data['allInstitutions'])
        }
        if (typeof(this.filters) !== 'undefined') {
          this.assignFilters(this.filters, this._storage.getSession('allInstitutions'))
        }
      }, err => {
        this.allInstFailed = true

        // on error of all institutions, we still need to call subscriveAvailableFilter
        this.assignFilters(this.filters, [])
        console.log(err.status)
    })).subscribe()

    this.subscriptions.push(
      this._filters.available$.pipe(
        map(filters => {
          this.filters = filters
          if (this._storage.getSession('allInstitutions') !== 'undefined') {
            this.assignFilters(filters, this._storage.getSession('allInstitutions'))
          }
        }
      )).subscribe()
    )

    this.filterNameMap = this._filters.getFilterNameMap()

    // Read filters from URL
    this.subscriptions.push(

      this.route.params.pipe(map(routeParams => {
        this.term = routeParams['term'];

        if (routeParams['startDate'] && routeParams['endDate']){
          this.filterDate = true;
        }

        // When params are adjusted, applied filters need to be cleared
        // this._filters.clearApplied();

        // Find feature flags applied on route
        this._flags.readFlags(routeParams)

        for (let paramName in routeParams) {
            if (this._filters.isFilterGroup(paramName)) {
              let parsedParam: any

              try { // attempt to parse an array param
                parsedParam = JSON.parse(routeParams[paramName])
              } catch (err) { // param is not an array
                parsedParam = routeParams[paramName]
              }
              this._filters.apply(paramName, parsedParam);
            }
        }
      })).subscribe()
    );

    // Subscribe to all applied filters in case something fires outside this component
    this.subscriptions.push(
      this._filters.applied$.pipe(
        map(filters => {
          this.appliedFilters = filters
      })).subscribe()
    )

  } // ngOnInit


  private assignFilters(filters: any, institutionList: any[]): void {
    // Contributors List of search results
    if (filters['donatinginstitutionids'] && institutionList.length) {
      this.instFilterCount = 0

      for (let i = 0; i < filters['donatinginstitutionids'].length; i++) {

        // Map search results by contributing institution by matching against names from the institutions list
        for (let j = 0; j < institutionList.length; j++) {
          if (filters['donatinginstitutionids'][i].name === institutionList[j].institutionId) {
            filters['donatinginstitutionids'][i].showingName = institutionList[j].institutionName;
          }
        }

        // If this contributor is the users institution, set instFilterCount to this filters' count value
        if (filters['donatinginstitutionids'][i].name === this.userInstId) {
          if (filters['donatinginstitutionids'][i].count > -1) {
            this.instFilterCount = parseInt(filters['donatinginstitutionids'][i].count)
          }
        }
      }
    }

    if (filters['collectiontypes']) {

      for (let i = 0; i < filters['collectiontypes'].length; i++) {
        let colType = filters['collectiontypes'][i]

        // The loggedd in user's institutional 'Collection Type' filter
        if (colType.name == '2' || colType.name == '4') {
          filters['collectiontypes'][i]['count'] = this.instFilterCount
        }
      }

      // If auth.isPublicOnly 'unaffiliated' user, filter out all but type 5 collection type
      if (this._auth.isPublicOnly()) {
        filters['collectiontypes'] = filters['collectiontypes'].filter(collectionType => collectionType.name === '5')
      }
    }

    // it is for if the allInstitutions request fails, it doesn’t break the entire filter UI
    if (this.allInstFailed) {
      filters['donatinginstitutionids'] = null
    }

    // Filter out categories containing pipe in name field
    if (filters && filters.artclassification_str && filters.artclassification_str.length !== 0 ) {
      filters.artclassification_str = filters.artclassification_str.filter((category) => {
        return category.name.indexOf('|') === -1
      })
    }
    this.availableFilters = filters
    // Push search changes to GTM data layer
    this.trackSearchDataLayer(this.appliedFilters, this.availableFilters)
  } // assignFilters

  /**
   * Update search vars in GTM data layer
   * @param appliedFilters
   * @param filters  available filters
   */
  private trackSearchDataLayer(appliedFilters, filters) {
    if (!appliedFilters || !filters) {
      return
    }
    let classification = ''
    let geography = ''
    let contributor = ''
    for (let i = 0; i < appliedFilters.length; i++){
      let filter = appliedFilters[i]
      if (filter.filterGroup.indexOf('classification') >= 0) {
        classification = (filters.artclassification_str && filters.artclassification_str[0]) ? filters.artclassification_str[0].name : ''
      } else if (filter.filterGroup.indexOf('geography') >= 0) {
        geography = (filters.geography && filters.geography[0]) ? filters.geography[0].name : ''
      } else if (filter.filterGroup.indexOf('donating') >= 0){
        contributor = (filters.donatinginstitutionids && filters.donatinginstitutionids[0]) ? filters.donatinginstitutionids[0].showingName : ''
      }
    }
    // Track search filters in GTM data layer
    let searchGTMVars = {
      'searchTerm': this.term || '',
      'selectedClassification': classification,
      'selectedGeography': geography,
      'selectedContributor': contributor
    }
    // Push to GTM data layer
    this.angulartics.eventTrack.next( { properties : {
      gtmCustom : {
        "search" : searchGTMVars
      }
    } });
  }

  private loadRoute(filterType?: string) {
    let params = {};
    let currentParams = this.route.snapshot.params

    // Maintain feature flags
    if (currentParams['featureFlag']) {
      params['featureFlag'] = currentParams['featureFlag']
    }

    if (this.availableFilters.dateObj && this.availableFilters.dateObj.modified == true && this.filterDate) {
      params['startDate'] = this.availableFilters.dateObj.earliest.date * (this.availableFilters.dateObj.earliest.era == 'BCE' ? -1 : 1);
      params['endDate'] = this.availableFilters.dateObj.latest.date * (this.availableFilters.dateObj.latest.era == 'BCE' ? -1 : 1);
    }

    for (let filter of this.appliedFilters) {
      if (filter.filterGroup == 'page'){
        params[filter.filterGroup] =  parseInt(filter.filterValue[0]);
      }
      else if (filter.filterGroup == 'size'){
        params[filter.filterGroup] =  parseInt(filter.filterValue[0]);
      }
      else if (filter.filterGroup == 'sort'){
        params[filter.filterGroup] =  parseInt(filter.filterValue[0]);
      }
      else if ((filter.filterGroup != 'startDate') && (filter.filterGroup != 'endDate') && (filter.filterValue && filter.filterValue.length > 0)){
        // Arrays must be stringified, as angular router doesnt handle them well
        params[filter.filterGroup] =  Array.isArray(filter.filterValue) ? JSON.stringify(filter.filterValue) : filter.filterValue;
      }
    }

    this.angulartics.eventTrack.next({ properties: { event: 'filteredSearch', category: 'search', label: filterType } })

    if (params['page']){
      params['page'] = this.pagination.page
    }

    if (currentParams.colId || currentParams.catId){

      let baseParams = {}

      if (currentParams.name){
        baseParams['name'] = currentParams.name
      }
      if (currentParams.size){
        baseParams['size'] = currentParams.size
      }
      if (currentParams.page){
        baseParams['page'] = currentParams.page
      }
      if (currentParams.sort){
        baseParams['sort'] = currentParams.sort
      }
      if (this._filters.searchWithin && currentParams.term){ // If searchWithin is checked, then include the term param as well
        baseParams['term'] = currentParams.term
      }

      let queryParams = Object.assign(baseParams, params)
      let colId = currentParams.colId ? currentParams.colId : currentParams.catId
      let route = currentParams.colId ? 'collection' : 'category'

      this.router.navigate( [ '/' + route, colId, queryParams ] )
    }
    else{
      this.router.navigate(['search', this.term ? this.term : '*', params])
    }

  }

  changeSortOpt(index, label) {
    this.activeSort.index = index;
    this.activeSort.label = label;
    this.pagination.page = 1;
    this.loadRoute('sort');
  }

  /**
   * Get keys of Object as an array of strings
   * - Convenience function useful for ngFor loops
   * @param obj Any Object
   */
  keys(obj: any): Array<string> {
    return (Object.keys(obj) && Object.keys(obj).length > 0) ? Object.keys(obj) : []
  }

  isArray(thing): boolean {
    return Object.prototype.toString.call( thing ) === '[object Array]'
  }

  toggleEra(dateObj){
    if (dateObj.era == 'BCE'){
      dateObj.era = 'CE';
    }
    else{
      dateObj.era = 'BCE';
    }
  }

  toggleTree(geoFacet){
    if (geoFacet.expanded){
      geoFacet.expanded = false;
    }
    else{
      geoFacet.expanded = true;
    }

  }

  toggleFilter(value, group){
    let addFilter: boolean = false
    if (this._filters.isApplied(group, value)){ // Remove Filter
      this._filters.remove(group, value)
    } else { // Add Filter
      this._filters.apply(group, value)
      addFilter = true
    }
    this.pagination.page = 1

    this.loadRoute(addFilter ? group : '');
  }

  filterApplied(value, group){
    return this._filters.isApplied(group, value);
  }

  clearAllFilterGroup(group){
    if (group == 'date'){
      this.availableFilters.dateObj.modified = false;
    }
    else{
      for (let i = 0; i < this.appliedFilters.length; i++){
        let filter = this.appliedFilters[i];
        if (filter.filterGroup === group){
          this.appliedFilters.splice(i, 1);
          i = -1;
        }
      }
    }

    this.pagination.page = 1;

    this.loadRoute('');
  }

  // To check if a filter group has any applied filters
  hasAppliedFilters(group): boolean {
    let hasFilters: boolean = false;

    if (group == 'date'){
      hasFilters = this.availableFilters.dateObj.modified;
    }
    else{
      for (let i = 0; i < this.appliedFilters.length; i++){
        let filter = this.appliedFilters[i];
        if (filter.filterGroup === group){
          hasFilters = true;
          break;
        }
      }
    }
    return hasFilters;
  }

  clearDateFilter() {
    this.availableFilters.dateObj.modified = false;
    this.availableFilters.dateObj.earliest.date = this.availableFilters.prevDateObj.earliest.date;
    this.availableFilters.dateObj.earliest.era = this.availableFilters.prevDateObj.earliest.era;

    this.availableFilters.dateObj.latest.date = this.availableFilters.prevDateObj.latest.date;
    this.availableFilters.dateObj.latest.era = this.availableFilters.prevDateObj.latest.era;
    // this._filters.generateDateFacets();
  }

  removeFilter(filterObj){
    this._filters.remove(filterObj.filterGroup, filterObj.filterValue);
  }

  getUniqueColTypeIds(facetArray){
    let colTypeIds = [];
    for (let i = 0; i < facetArray.length; i++){
      let facetObj = facetArray[i];
      let idArray = facetObj.collectionType.split(',');
      for (let j = 0; j < idArray.length; j++){
        idArray[j] = idArray[j].trim();
        if (colTypeIds.indexOf(idArray[j]) === -1){
          colTypeIds.push(idArray[j]);
        }
      }
    }
    return colTypeIds;
  }


  applyDateFilter(){
    let sdate = parseInt(this.availableFilters.dateObj.earliest.date);
    sdate = this.availableFilters.dateObj.earliest.era == 'BCE' ? (sdate * -1) : sdate;

    let edate = parseInt(this.availableFilters.dateObj.latest.date);
    edate = this.availableFilters.dateObj.latest.era == 'BCE' ? (edate * -1) : edate;

    // Show error message if Start date is greater than End date
    if (sdate > edate){
      this.dateError = true;
      return;
    }
    else{
      this.dateError = false;
    }

    this.availableFilters.dateObj.modified = true;
    this.filterDate = true;
    this.pagination.page = 1;
    this.loadRoute('date');
  }

  existsInRegion(countryId, childerenIds){
    let result = false;
    for (let i = 0; i < childerenIds.length; i++){
      let child = childerenIds[i];
      if (child._reference == countryId){
        result = true;
        break;
      }
    }
    return result;
  }

  private dateKeyPress(event: any): boolean{
      if ((event.key === 'ArrowUp') || (event.key === 'ArrowDown') || (event.key === 'ArrowRight') || (event.key === 'ArrowLeft') || (event.key === 'Backspace') || (event.key === 'Tab')){
        return true;
      }

      let theEvent = event || window.event;
      let key = theEvent.keyCode || theEvent.which;
      key = String.fromCharCode( key );
      let regex = /[0-9]|\./;
      if ( !regex.test(key) ) {
        theEvent.returnValue = false;
        if (theEvent.preventDefault) theEvent.preventDefault();
      }

      return theEvent.returnValue;
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

}
