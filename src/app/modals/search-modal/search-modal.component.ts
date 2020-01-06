import { Subscription } from 'rxjs'
import { map, take, filter } from 'rxjs/operators'
import { ActivatedRoute, Router } from '@angular/router'
import { Component, OnInit, Output, EventEmitter, AfterViewInit, ElementRef, ViewChild } from '@angular/core'
import { Angulartics2 } from 'angulartics2'

// Project dependencies
import { SearchQueryUtil } from './search-query'
import { AssetFiltersService } from './../../asset-filters/asset-filters.service'
import { AuthService, AssetService, AssetSearchService, CollectionService, DomUtilityService } from '_services'
import { AppConfig } from '../../app.service'

@Component({
  selector: 'ang-search-modal',
  templateUrl: 'search-modal.component.pug',
  styleUrls: [ 'search-modal.component.scss' ]
})
export class SearchModal implements OnInit, AfterViewInit {
  @Output()
  public closeModal: EventEmitter<any> = new EventEmitter();

  @ViewChild("advanced-search-title", {read: ElementRef}) advSearchTitleElement: ElementRef;

  public fields = []

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

  public error: any = {};
  public advanceQueries = [];
  public advanceSearchDate: any = {
    'startDate' : '',
    'startEra' : 'BCE',
    'endDate' : '',
    'endEra' : 'CE'
  }

  // Filters
  public availableFilters: FacetGroup[] = []
  public loadingFilters: boolean
  private filterNameMap: any = {}

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
  private instName: string = ''
  private instCollections: any[] = []
  private filterSelections: any[] = []
  private subscriptions: Subscription[] = []
  private showPrivateCollections = false
  private showCollectionType: boolean = false;

  // Search query trasnformation logic is abstracted to a utility
  private queryUtil: SearchQueryUtil = new SearchQueryUtil()

  // Flag while transitioning to Solr search
  private hideLegacyFilters: boolean

  constructor(
        private _appConfig: AppConfig,
        private _assets: AssetService,
        private _search: AssetSearchService,
        private _filters: AssetFiltersService,
        private _router: Router,
        private route: ActivatedRoute,
        private angulartics: Angulartics2,
        private _auth: AuthService,
        // Solr Search service
        private _assetFilters: AssetFiltersService,
        private _dom: DomUtilityService,
        private _collectionService: CollectionService
      ) {

    // Setup two query fields
    this.advanceQueries.push(Object.assign({}, this.advQueryTemplate));
    this.advanceQueries.push(Object.assign({}, this.advQueryTemplate));
    this.showPrivateCollections = this._appConfig.config.browseOptions.myCol;
    this.showCollectionType = _appConfig.config.advSearch.showCollectionTypeFacet
  }

  ngOnInit() {
    this.filterNameMap = this._filters.getFilterNameMap()
    document.body.style.overflow = 'hidden';

    this.fields = this._search.filterFields
    this.hideLegacyFilters = true
    this.loadingFilters = true
    this.loadFilters()
  }

  ngAfterViewInit() {
    this.startModalFocus()
  }

  // Set initial focus on the modal Title h1
  public startModalFocus() {
    // let modalStartFocus = <HTMLElement>this._dom.byId('advanced-search-title')
    // modalStartFocus.focus()
    if (this.advSearchTitleElement && this.advSearchTitleElement.nativeElement){
      this.advSearchTitleElement.nativeElement.focus()
    }
  }

  public close(): void {
    document.body.style.overflow = 'auto';
    this.closeModal.emit()
  }

  // Will only be executed on client side application
  public dateKeyPress(event: any): boolean{
      // Add check of Tab key to make sure the tabbingis enabled on Firefox
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

  public resetFilters(): void {
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
  public validateForm(): boolean {
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
    else if (startDate > endDate){
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

  public applyAllFilters(): void {
    if (!this.validateForm()) {
      return;
    }
    // Clear existing filters set outside this modal
    this._filters.clearApplied(true)
    let advQuery = this.queryUtil.generateSearchQuery(this.advanceQueries)
    let filterParams = this.queryUtil.generateFilters(this.filterSelections, this.advanceSearchDate)
    let currentParams = this.route.snapshot.params
    let queryParams = {}

    // Consolidate filters with multiple applied
    filterParams = this.combineMulitpleAppliedFilters(filterParams)

    // Maintain feature flags
    if (currentParams['featureFlag']) {
      queryParams['featureFlag'] = currentParams['featureFlag']
    }

    // Build Solr query string from filters
    let orQuery: string = this.buildSolrQuery(advQuery, filterParams)

    // Apply date filter
    if(filterParams["startDate"]) {
      queryParams["startDate"] = filterParams["startDate"]
    }
    if(filterParams["endDate"]) {
      queryParams["endDate"] = filterParams["endDate"]
    }

    // Apply geography filter
    if (filterParams['geography']) {
      queryParams['geography'] = []
      for (let efq of filterParams['geography'].split('|')) {
        queryParams['geography'].push(efq)
      }
    }

    // Track in angulartics
    this.angulartics.eventTrack.next({ properties: { event: 'advSearch', category: 'search', label: advQuery } })
    // Open search page with new query
    this._router.navigate(['/search', orQuery, queryParams])
    // Close advance search modal
    this.close();
  }

  /**
   * Combine multiple applied filters, from the same filter group, seperated by a `|`
   */
  public combineMulitpleAppliedFilters(filterParams) {
    for (let key in filterParams) {
      let filterValue = ''
      if ( filterParams[key] instanceof Array ){
        let filterValue = ''
        for ( let filter of filterParams[key]){
          filterValue += filterValue ? '|' + filter : filter
        }
        filterParams[key] = filterValue
      }
    }
    return filterParams
  }

  /**
   * Construct OR query between filters within the same filter group
   * filters across multiple filter groups will be AND-ed
   * example orQuery: paints AND artclassification_str:"Photographs" OR artclassification_str:"Paintings" OR artclassification_str:"Prints" OR artclassification_str:"photographs" AND year:[-4000 TO 1980]
   */
  public buildSolrQuery(advQuery, filterParams) {
    let orQuery: string = advQuery

    for(let key in filterParams) {
      if(key !== 'startDate' && key !== 'endDate' && key !== 'geography') {
        if (orQuery.length > 0) {
          orQuery += ' AND ('
        } else {
          orQuery = '('
        }
        let filterValues = filterParams[key].split('|')
        let index = 0
        for(let value of filterValues) {
          if(index > 0) {
            orQuery += ' OR '
          }
          orQuery += key + ':"' + value + '"'
          index++
        }
        // And closing parenthesis
        orQuery += ')'
      }
    }

    return orQuery
  }

  /**
   * Open Help page on Advanced Search
   * Will only be executed on client side application
   */
  public openHelp(): void {
    window.open('http://support.artstor.org/?article=advanced-search', 'Advanced Search Support', 'width=800,height=600');
  }

  /**
   * Update advanceQueries, advanceSearchDate and selected filters based on applied filters from URL
   */
  // TODO This function needs to be smaller
  private loadAppliedFiltersFromURL(): void{
    let routeParams = this.route.snapshot.params
    // Setup selected filters object to show applied filters for edit
    let appliedFiltersObj = {}
    let query: string = routeParams['term']
    if (!query) {
      // Do not process if query does not exist
      this.loadingFilters = false
      return
    }
    this.createGeographyFilterListFromParam(routeParams, appliedFiltersObj);

    // Process advance search query string
    query = query.replace(/\(|\)/g, '')
    appliedFiltersObj = this.processAdvSrchQueryString(query, appliedFiltersObj)

    // Maintain date filters via regular Asset Filters
    if (routeParams['startDate'] || routeParams['endDate']) {
      appliedFiltersObj['startDate'] = routeParams['startDate']
      appliedFiltersObj['endDate'] = routeParams['endDate']
    }
    // Use cleaned params for applying
    routeParams = appliedFiltersObj
    // Used to determine if generateSelectedFilters will be called or not, should only be called if we have a tri-state checkbox checked
    let updateSelectedFilters: boolean = false
    for (let key in routeParams){
      switch ( key ){
        case 'term': { // Update the advanceQueries Array as per the term param
          this.updateAdvanceQueries( routeParams )
          break
        }

        case 'startDate': { // Update advanceSearchDate Object as per the startDate
          this.advanceSearchDate.startDate = Math.abs(routeParams[key])
          this.advanceSearchDate.startEra = parseInt(routeParams[key]) < 0 ? 'BCE' : 'CE'
          break
        }

        case 'endDate': { // Update advanceSearchDate Object as per the endDate
          this.advanceSearchDate.endDate = Math.abs(routeParams[key])
          this.advanceSearchDate.endEra = parseInt(routeParams[key]) < 0 ? 'BCE' : 'CE'
          break
        }

        // For tri-state checkboxes set the checked flag for filter object based on param value and in the end run generateSelectedFilters to updated selected filters object
        case 'artclassification_str': {
          let classificationFilters = routeParams[key].split('|')
          for (let filter of classificationFilters){
            let clsFilterGroup =  this.availableFilters.find( filterGroup => filterGroup.name === key )
            let updateFilterObj = clsFilterGroup && clsFilterGroup.values.find( filterObj => filterObj.value === filter )
            updateFilterObj && (updateFilterObj.checked = true)
          }
          updateSelectedFilters = true
          break
        }

        case 'collectiontypes': {
          let filters = routeParams[key].split('|')
          for (let filter of filters){
            let filterGroup = this.availableFilters.find( filterGroup => filterGroup.name === key )
            let updtFilterObj = filterGroup.values.find( filterObj => filterObj.value === filter )
            this.checkFilter(updtFilterObj, filterGroup, filter, false)
          }
          updateSelectedFilters = true
          break
        }

        case 'geography': {
          let filterGroup = this.availableFilters.find( filterGroup => filterGroup.name === key )
          if (filterGroup) {
            this.loadGeographyFilters(routeParams, key, filterGroup);
          }
          break
        }

        case 'collections': {
          let colIds = routeParams[key].split('|')
          for (let colId of colIds){ // Indv. collection filters are only available udner Inst. Col Type filter. Find the collection filter object and mark it checked
            let filterGroup =  this.availableFilters.find( filterGroup => filterGroup.name === 'collectiontypes' )
            let instColFilters = filterGroup.values.find( colTypefilter => colTypefilter.value === '2' )
            // Public user will not return any institution collections
            let updtFilterObj = instColFilters && instColFilters.children.find( filterObj => filterObj.value === colId )
            if ( updtFilterObj ){
              updtFilterObj.checked = true
            }
          }
          updateSelectedFilters = true
          break
        }
      }
    }

    // Finally generate selected filters from available filters marked as checked if any
    if ( updateSelectedFilters ) {
      this.generateSelectedFilters()
    }

    // Done loading filters and prefilling
    this.loadingFilters = false
  }

  private createGeographyFilterListFromParam(routeParams, appliedFiltersObj) {
    let geography: string = routeParams['geography']
    if (geography) {
      appliedFiltersObj['geography'] = geography.startsWith('[') ? JSON.parse(geography) : geography.split(',')
    }
  }

  private loadGeographyFilters(routeParams, key, filterGroup) {
    let geography = routeParams[key]
    let selections = typeof geography === 'string' ? [geography] : geography
    for (let efq of selections) {
      let updtFilterObj = filterGroup.values.find(filterObj => filterObj.efq === efq)
      this.checkFilter(updtFilterObj, filterGroup, efq, true)
    }
  }

  /**
   * clean out wrapping parenthesis for OR queries
   * @param query Query string from route params
   * @param appliedFiltersObj Applied filters object
   */
  private processAdvSrchQueryString(query, appliedFiltersObj) {
    let andQuerySegments = query.split(' AND ')
    for(let andQuerySegment of andQuerySegments) {
      let orQuerySegments = andQuerySegment.split(' OR ')
      let termOperator = orQuerySegments.length > 1 ? ' OR ' : ' AND '

      for(let orQuerySegment of orQuerySegments) {
        if( orQuerySegment.indexOf(':') > -1 ) { // Its a filter query
          let key = orQuerySegment.split(':')[0]
          let value = orQuerySegment.split(':')[1]
          if(key === 'year') {
            appliedFiltersObj['startDate'] = value.replace('[','').replace(']', '').split(' TO ')[0]
            appliedFiltersObj['endDate'] = value.replace('[','').replace(']', '').split(' TO ')[1]
          } else {
            appliedFiltersObj[key] = appliedFiltersObj[key] ? appliedFiltersObj[key] + '|' + value.replace(/"/g, '') : value.replace(/"/g, '')
          }
        } else { // Its a term query
          appliedFiltersObj['term'] = appliedFiltersObj['term'] ? appliedFiltersObj['term'] + termOperator + orQuerySegment : orQuerySegment
        }
      }
    }

    return appliedFiltersObj
  }

  /**
   * Mark the filter as checked in available filters
   * If available, child filters should also be marked checked
   */
  private checkFilter(updtFilterObj, filterGroup, filterValue, geographyFilter){
    if ( updtFilterObj ){ // If match is found at the parent node level
      updtFilterObj.checked = true
      if ( updtFilterObj.children && updtFilterObj.children.length > 0 ){
        for (let child of updtFilterObj.children){
          child.checked = true
        }
      }
    } else{ // If we don't find a match at parent node level then search for a match in children nodes
      for (let value of filterGroup.values){
        if (value.children && value.children.length > 0){
          let updtFilterObj = value.children.find( filterObj => {
            let match = geographyFilter ? filterObj.efq === filterValue : filterObj.value === filterValue
            return match
          })
          if (updtFilterObj){
            updtFilterObj.checked = true
            break
          }
        }
      }
    }
  }

  private updateAdvanceQueries( params: any ): void{
    let terms = params['term'].split(' ')
    if ( terms.length > 0 ){
      this.advanceQueries = []
      let operator = 'AND'
      for (let term of terms){
        if ( term === 'AND' || term === 'OR' || term === 'NOT' ){
          operator = term
          continue
        }
        let termSubArray = term.split(':')
        let value = termSubArray.length > 1 ? termSubArray[1].slice(1, -1) : termSubArray[0]
        let field = termSubArray.length > 1 ? termSubArray[0] : ''

        let advQueryObj = {
          term: value,
          field: this._search.filterFields.filter( fieldObj => fieldObj.value === field )[0],
          operator: operator
        }
        this.advanceQueries.push(advQueryObj)
      }
      this.addAdvanceQuery()
    }
  }

  /**
   * Load filters (Geo, Collection, Collection Type)
   */
  private loadFilters(): void {
    this._search.getFacets().pipe(
    take(1),
    map(data => {

      // Process through "facets" & construct the availableFilters array, based on the defined interfaces, from facets response
      for (let facetKey in data['facets']) {
        const facet = data['facets'][facetKey]

        if ((facet.name === 'collectiontypes' && this.showCollectionType) || facet.name !== 'collectiontypes') {
          // Construct Facet Group
          let facetGroup: FacetGroup = {
            name: facet.name,
            values: []
          }

          // Prune any facets not available to the user (ex. Private Collections on SAHARA)
          for (let i = facet.values.length - 1; i >= 0; i--){
            let facetName = facet.values[i].name
            if (!this.showPrivateCollections && facetName.match(/3|6/)) { // NOTE: 3 & 6 are Private Collections names
              facet.values.splice(i, 1)
            }
            if (this._auth.isPublicOnly() && facet.name == 'collectiontypes' && !(facetName.match(/5/))) { // For public user, only show public collection in collectiontype filter, 5 is Public Collection name
              facet.values.splice(i, 1)
            }
            else if ( (facetName && facetName.length > 0) && (facetName.indexOf('|') === -1) ){ // Some filters return empty strings, avoid those
              // Make sure the facet name is properly formatted and doesn't contain `|` symbol
              // Push filter objects to Facet Group 'values' Array
              let facetObject: FacetObject = {
                checked: false,
                name: facet.name === 'collectiontypes' ? this.filterNameMap['collectiontypes'][facetName] : facetName,
                count: facet.values[i].count,
                efq: facet.values[i].efq,
                value: facetName,
                children: []
              }

              // institutional collection counts are wrong, so assign them a count of 0 to indicate it shouldn't be displayed
              facetObject.value == '2' && (facetObject.count = 0)

              facetGroup.values.push( facetObject )
            }
          }
          facetGroup.values.reverse()
          this.availableFilters.push(facetGroup)
        }
      }

      // Process "hierarchies2" & create Geo Facet Group & push it to available filters
      for (let hierFacet in data['hierarchies2']) {
        let topObj = this._assetFilters.generateHierFacets(data['hierarchies2'][hierFacet].children, 'geography')

        let geoFacetGroup: FacetGroup = {
          name: 'geography',
          values: []
        }

        for (let geoObj of topObj){
          let geoFacetObj: FacetObject = {
            checked: false,
            name: geoObj.name,
            count: geoObj.count,
            efq: geoObj.efq,
            value: geoObj.name,
            children: []
          }

          for (let child of geoObj.children){
            let geoChildFacetObj: FacetObject = {
              checked: false,
              name: child.name,
              count: child.count,
              efq: child.efq,
              value: child.name
            }

            geoFacetObj.children.push( geoChildFacetObj )
          }
          geoFacetGroup.values.push( geoFacetObj )
        }
        this.availableFilters.push( geoFacetGroup )
      }

      // Pre-fill any currently applied filters
      this.loadAppliedFiltersFromURL()
    })).subscribe()

  }

  /**
   * Depracated once new search launches
   */
  private legacyLoadFilters(): void {
    // Get GeoTree and Classifications
    // this._assets.loadTermList( )
    //       .then((res) => {
    //           console.log(res);
    //           this.termsList = res;
    //       })
    //       .catch(function(err) {
    //           console.error('Unable to load Terms List.');
    //       });

    this.subscriptions.push(
      this._auth.getInstitution().pipe(
        map(institutionObj => {
          console.log(institutionObj)
          if (institutionObj['shortName']) {
              this.instName = institutionObj['shortName']
          }
        },
        (err) => {
          console.log('Nav failed to load Institution information', err)
        }
      )).subscribe()
    )

    // Get institutional collections
    this.subscriptions.push(
      this._collectionService.getCollectionsList('institution').pipe(
        map(data => {
            this.colTree.push({
              id: 'allSS',
              name: 'Institutional Collections',
              collections: data['Collections']
            });
        },
        (err) => {
          if (err && err.status != 401 && err.status != 403) {
            console.error(err)
          }
        }
      )).subscribe()
    )
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
    if (this.advanceSearchDate[dateEra] == 'BCE'){
      this.advanceSearchDate[dateEra] = 'CE';
    }
    else{
      this.advanceSearchDate[dateEra] = 'BCE';
    }
  }

  private toggleFilter( filterObj: FacetObject, parentFilterObj?: FacetObject): void{
    // Toggle filter checked state
    filterObj.checked = !filterObj.checked

    if ( parentFilterObj ) { // If a child node is clicked, check the parent node if all children are checked else do otherwise
      let parentChecked: boolean = true
      for ( let child of parentFilterObj.children ){
        if ( !child.checked ){
          parentChecked = false
          break
        }
      }
      parentFilterObj.checked = parentChecked
    } else if ( filterObj.children ) { // If a parent node is clicked and it has children make sure they are all checked/unchecked accordingly
      for ( let child of filterObj.children ){
        child.checked = filterObj.checked
      }
    }
    this.generateSelectedFilters()
  }

  private generateSelectedFilters(): void {
    let selectedFiltersArray: Array<SelectedFilter> = []
    // Traverse the availableFilters and check which ones are checked and push them to selectedFilters Array
    for ( let filterGroup of this.availableFilters ) {
      for ( let filter of filterGroup.values ){
        // If the parent node is checked just push the selected filter object for the parent itself, no need to check the children
        let selectedFilterObject: SelectedFilter = {} as SelectedFilter
        if ( filter.checked ){
          selectedFilterObject.group = filterGroup.name
          selectedFilterObject.value = filter.value
          selectedFilterObject.efq = filter.efq
        }
        else if ( filter.children ){ // If the parent is not checked then check the children and push thier selected filter objects individually
          for ( let child of filter.children ){
            if ( child.checked ){
              selectedFilterObject.group = filterGroup.name === 'collectiontypes' ? 'collections' : filterGroup.name
              selectedFilterObject.value = child.value
              selectedFilterObject.efq = child.efq
            }
          }
        }
        if ( Object.entries(selectedFilterObject).length) {
          selectedFiltersArray.push( selectedFilterObject )
        }
      }
    }
    this.filterSelections = selectedFiltersArray
    this.validateForm()
  }

  // Gives the index of an object in an array
  private arrayObjectIndexOf(array, searchObj): number {
    for (let i = 0; i < array.length; i++) {
        if ( (array[i].group === searchObj.group) && (array[i].value === searchObj.value) ) return i;
    }
    return -1;
  }

  // close the dropdown when it is the last button in the dropdown and user hits tab key
  private closeDropdown(currentIndex, length, dropdown) {
    if (currentIndex === length - 1) {
      dropdown.close();
    }
  }
}

interface FacetObject {
  name: string,
  value: string,
  checked: boolean,
  count: number,
  efq: string,
  children?: Array<FacetObject>
}
interface FacetGroup {
  name: string,
  values: Array<FacetObject>
}
interface SelectedFilter {
  group: string,
  value: string,
  efq: string
}
