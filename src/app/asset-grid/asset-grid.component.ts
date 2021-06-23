import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer, Inject, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { ActivatedRoute, NavigationStart, Params, Router } from '@angular/router'

import { BehaviorSubject, Subscription } from 'rxjs'
import { map, take } from 'rxjs/operators'
import { AppConfig } from '../app.service'
import { Angulartics2 } from 'angulartics2'

import {
  AuthService,
  AssetSearchService,
  AssetService,
  GroupService,
  ImageGroupService,
  LogService,
  ToolboxService,
  FlagService,
  DomUtilityService
} from '_services'
import { AssetThumbnail, ImageGroup } from 'datatypes'
import { AssetFiltersService } from '../asset-filters/asset-filters.service'
import { APP_CONST } from '../app.constants'
import { ArtstorStorageService } from '../../../projects/artstor-storage/src/public_api'
import { SortablejsOptions } from 'angular-sortablejs';

@Component({
  selector: 'ang-asset-grid',
  styleUrls: [ './asset-grid.component.scss' ],
  templateUrl: './asset-grid.component.pug'
})

export class AssetGrid implements OnInit, OnDestroy {
  @Input()
  set assetCount(count: number) {
    if (typeof(count) != 'undefined') {
      this.totalAssets = count
    }
  }
  get assetCount(): number {
    return this.totalAssets
  }

  public isPersonalCollection: boolean = false;
  public searchLoading: boolean;
  public showFilters: boolean = true;
  public showAdvancedModal: boolean = false;
  errors = {};
  public results: any[] = [];
  public visibleResults: any[] = [];
  public invisibleResults: any[] = [];
  filters = [];
  public editMode: boolean = false;
  public reorderMode: boolean = false;
  public showLoseReorder: boolean = false;
  public arrowReorderMode: boolean = false;
  public arrowReorderMessage: string = ''

  // Default show as loading until results have update
  public isLoading: boolean = true;
  public searchError: string = '';
  public searchLimitError: boolean = false;

  public searchTerm: string = '';

  // Flag to check if the results have any restricted images.
  public restricted_results: any[] = [];

  // Value
  public totalAssets: number = 0;

  // Group display
  private _igMetaData: ImageGroup = {}
  public igDisplay: boolean = false
  public showIgDescBool: boolean = true
  public animationFinished: boolean = true

  // Passed in from groups page only
  @Input()
  set igMetaData(metadata: ImageGroup) {
    this._igMetaData = metadata
    if (metadata.id){
      this.igDisplay = true
    } else {
      this.igDisplay = false
    }
  }
  get igMetaData(): ImageGroup {
    return this._igMetaData
  }

  // @Input()
  // private allowSearchInRes:boolean;

  @Output() reordering: EventEmitter<boolean> = new EventEmitter();

  public dateFacet = {
    earliest : {
      era : 'BCE'
    },
    latest : {
      era : 'CE'
    },
    modified : false
  };

  public activeSort = {
    index : '0',
    label : 'Relevance'
  };

  // Options for Sortablejs reordering of assets
  public sortableOptions: SortablejsOptions = {
    onUpdate: (event) => {
      this.orderChanged = true
    }
  }
  // Add user to decide whether to show the banner
  private user: any = this._auth.getUser();

  private siteID: string = ''

  // Set our default values
  private subscriptions: Subscription[] = [];
  // Sometimes we get all the ids but not thumbnails for assets (eg. Groups)
  private itemIds: string[] = [];
  // Array to be filled with *all* assets for reorder mode
  private allResults: any[] = [];
  private orderChanged: boolean = false;

  private largeThmbView: boolean = false;

  private selectedAssets: any[] = [];
  private formattedSearchTerm: string = '';
  private searchInResults: boolean = false;
  private isPartialPage: boolean = false;

  private excludedAssetsCount: number = 0;
  private sortFilterByDateTotal: number = 0;

  @Input()
  private actionOptions: any = {};

  // With most pages using Solr, we want to default assuming a max of 5000
  @Input()
  private hasMaxAssetLimit: boolean = true

  @Input()
  private allowIgUpdate: boolean = false;

  // @Output() updateSearchInRes: EventEmitter<boolean> = new EventEmitter();

  private pagination: {
    totalPages: number,
    size: number,
    page: number
  } = {
    totalPages: 1,
    size: 48,
    page: 1
  };

  private UrlParams: any = {
    term: '',
    size: 48,
    page: 1,
    startDate: 0,
    endDate: 0,
    igId: '',
    objectId: '',
    colId: '',
    catId: '',
    collTypes: '',
    sort: '0',
    coll: ''
  };

  // Object Id parameter, for Clusters
  private objectId: string = '';
  // Collection Id parameter
  private colId: string = '';
  // Image group
  private ig: any = {}

  // Used as a key to save the previous route params in session storage (incase of image group)
  private prevRouteTS: string = ''

  // TypeScript public modifiers
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    public _appConfig: AppConfig,
    private _assets: AssetService,
    public _auth: AuthService,
    private _filters: AssetFiltersService,
    private _flags: FlagService,
    private _groups: GroupService,
    private _ig: ImageGroupService,
    private _log: LogService,
    private angulartics: Angulartics2,
    private _renderer: Renderer,
    private _router: Router,
    private _search: AssetSearchService,
    private _toolbox: ToolboxService,
    private _storage: ArtstorStorageService,
    private route: ActivatedRoute,
    private _dom: DomUtilityService
  ) {
      this.siteID = this._appConfig.config.siteID;
      let prefs = this._auth.getFromStorage('prefs')
      if (prefs && prefs.pageSize && prefs.pageSize != 48) {
        this.pagination.size = prefs.pageSize
        this._router.navigate(
          ['.', this._toolbox.addToParams({ size: prefs.pageSize }, this.route.snapshot.params )],
          { relativeTo: this.route }
        )
      }
      if (prefs && prefs.largeThumbnails) {
        this.largeThmbView = prefs.largeThumbnails
      }

    this.isPersonalCollection = this._router.url.indexOf('pcollection/') > -1
  }

  private isBrowser: boolean = isPlatformBrowser(this.platformId)

  ngOnInit() {
    // Subscribe User object updates
    this.subscriptions.push(
      this._auth.currentUser.subscribe(
        (userObj) => {
          this.user = userObj;
        },
        (err) => {
          console.error('Nav failed to load Institution information', err)
        }
      )
    );

    // Subscribe to asset search params
    this.subscriptions.push(
      this.route.params.pipe(
      map((params: Params) => {

        // if advanced search, inject search survey script
        if (this.route.snapshot.params.advSearch) {
          this.injectAdvancedSearchSurvey();
        }

        // Find feature flags applied on route
        this._flags.readFlags(params)

        if (params['term']){
          this.searchTerm = params['term'];
          this.UrlParams.term = this.searchTerm;
        }

        let filterKeysToPass: string[] = [
          'catId',
          'colId',
          'pcolId',
          'clusterId',
          'startDate',
          'endDate',
          'artclassification_str',
          'geography',
          'collectiontypes'
        ]

        for (let i = 0; i < filterKeysToPass.length; i++) {
          let filterKey: string = filterKeysToPass[i]
          if (params[filterKey]) {
            this.UrlParams[filterKey] = params[filterKey]
          } else{ // Delete the param from UrlParams object if its not available in the route params
            delete this.UrlParams[filterKey]
          }
        }

        if (params['sort']){
          this.activeSort.index = params['sort']
          switch (this.activeSort.index) {
            case '0': {
              this.activeSort.label = 'Relevance'
              break
            }
            case '1': {
              this.activeSort.label = 'Title'
              break
            }
            case '2': {
              this.activeSort.label = 'Creator'
              break
            }
            case '3': {
              this.activeSort.label = 'Date'
              break
            }
            case '4': {
              this.activeSort.label = 'Recently Added'
              break
            }
            default: {
              break
            }
          }
        }
        else{ // If no sort params - Sort by Relevance
          this.activeSort.index = '0';
          this.activeSort.label = 'Relevance';
        }

        this.isLoading = true;
      })).subscribe()
    );

    // Subscribe to pagination values
    this.subscriptions.push(
      this._assets.pagination.pipe(
        map((pagination: any) => {
          this.pagination.page = parseInt(pagination.page)
          this.pagination.size = parseInt(pagination.size)

          const MAX_RESULTS_COUNT: number = APP_CONST.MAX_RESULTS
          if (this.assetCount) {
            let total = this.hasMaxAssetLimit && this.assetCount > MAX_RESULTS_COUNT ? MAX_RESULTS_COUNT : this.assetCount
            this.pagination.totalPages = Math.floor((total + this.pagination.size - 1) / this.pagination.size)
          } else {
            this.pagination.totalPages = parseInt(pagination.totalPages)
          }

          // last page is a partial page
          this.isPartialPage = (this.pagination.page * this.pagination.size) >= (MAX_RESULTS_COUNT - 1)
      })).subscribe()
    );

    /**
     * Subscription to allResults
     * - Provides thumbnails
     * - allResults maintains array of results which persists outside of this component
     */
    this.subscriptions.push(
      this._assets.allResults.pipe(
        map(allResults => {
          if (this.activeSort.index && this.activeSort.index == '3') {
            this.sortFilterByDateTotal =  allResults.total

            let withoutDateParams = Object.assign({}, this.UrlParams)
            if (withoutDateParams['startDate']){
              delete withoutDateParams['startDate']
              delete withoutDateParams['endDate']
              this._filters.clearAvailable(true)
            }

            this._search.search(withoutDateParams, this.searchTerm, '0').forEach((res) => {
              this.excludedAssetsCount = res.total - this.sortFilterByDateTotal
            })
          }
          else {
            this.excludedAssetsCount = 0
          }
          // Prep display of search term next to results count
          this.formatSearchTerm(this.searchTerm)
          // Update results array
          this.searchError = ''
          this.searchLimitError = false

          // Server error handling
          if (allResults === null) {
            this.isLoading = false
            this.searchError = 'There was a server error loading your search. Please try again later.'
            return
          }
          else if (allResults.errors && allResults.errors[0] && (allResults.errors[0] === 'Too many rows requested')){
            this.isLoading = false
            this.searchLimitError = true
            return
          }
          else if (allResults.error) {
            console.error(allResults.error)
            this.isLoading = false
            if (allResults.error.error.errors[0].name === 'limit-max-size-exceeded' || allResults.error.error.errors[0].name === 'query-length') {
              this.searchError = '<b>Unable to find any assets</b><p>A less specific query might be able to find what you are looking for.</p>'
            }
            else if (allResults.error.error.errors[0].name === 'pagination-total-results-exceeded') {
              this.searchError = 'Sorry, additional results cannot be displayed. In order to keep things quick, Artstor does not show more than 5000 results for any search. If you haven\'t found what you are looking for, try using advanced search.'
            }
            else {
              this.searchError = 'There was a server error loading your search. Please try again later.'
            }
            return
          }

          this.results = allResults.thumbnails

          if ('items' in allResults) {
            this.itemIds = allResults.items
            this.ig = allResults
          }
          this.restricted_results = allResults.restricted_thumbnails

          if (this.results && this.results.length > 0) {
            this.isLoading = false;
          } else {
            // We push an empty array on new search to clear assets
            this.isLoading = true;
          }

          const MAX_RESULTS_COUNT: number = APP_CONST.MAX_RESULTS
          if ('total' in allResults){
            this.totalAssets = allResults.total
            let total = this.hasMaxAssetLimit && this.totalAssets > MAX_RESULTS_COUNT ? MAX_RESULTS_COUNT : this.totalAssets
            this.pagination.totalPages = ( total === 0 ) ? 1 : Math.floor((total + this.pagination.size - 1) / this.pagination.size)
            this.isLoading = false
          } else if (this.assetCount && this.results && this.results.length > 0){
            this.totalAssets = this.assetCount
            this.isLoading = false;
          }

          this._storage.setSession('totalAssets', this.totalAssets ? this.totalAssets : 1)

          // Tie prevRouteParams array with previousRouteTS (time stamp) before sending to asset page
          this.prevRouteTS = Date.now().toString()
          let id: string = this.prevRouteTS

          let prevRouteParams = this._storage.getSession('prevRouteParams') || {}
          prevRouteParams[id] = this.route.snapshot.url
          this._storage.setSession('prevRouteParams', prevRouteParams)

          // Make sure to record the PrevRoute Timestamp/key to subject observable - will be subscribed later by ang-group-title for routing to presentMode
          this._assets.currentPreviousRouteTS = id

          // Generate Facets
          if (allResults && allResults.collTypeFacets) {
              this._filters.generateColTypeFacets( allResults.collTypeFacets );
              // this._filters.generateGeoFilters( allResults.geographyFacets );
              this._filters.generateDateFacets( allResults.dateFacets );
              this._filters.setAvailable('classification', allResults.classificationFacets);
          }

        },
        // allResults is not expected to throw errors (instead passing them in stream, to maintain the subscriptions)
        (error) => {
          console.error(error)
        }
      )).subscribe()
    );

    /**
     * Selected Assets subscription
     * - We want to subscribe to Asset Selection in case another component modifies the collection
     * - (Nav Menu modifies selection)
     */
    this.subscriptions.push(
      this._assets.selection.pipe(
        map(selectedAssets => {
          // Set selected assets
          this.selectedAssets = selectedAssets;
          // Trigger Edit Mode if items are being added to the selection
          if ( this.selectedAssets.length > 0 ) {
            this.editMode = true;
          }
        },
        error => {
          console.error(error);
        }
      )).subscribe()
    );

    this.subscriptions.push(
      this._assets.selectModeToggle.pipe(map(() => {
        this.toggleEditMode()
      })).subscribe()
    )

    // Clear all selected assets and close edit mode
    this.subscriptions.push(
      this._assets.clearSelectMode.pipe(
        map(value => {
          if (value){
            this.deactivateSelectMode();
          }
      })).subscribe()
    )

  } // ngOninit

  ngOnDestroy() {
    // Kill subscriptions
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });

    // Clear asset selection
    this._assets.setSelectedAssets([]);
  }

  /**
   * Format the search term to display advance search queries nicely
   */
  public formatSearchTerm(query: string): void {
    let fQuery = '"' + query + '"';
    // Cleanup filter pipes
    // fQuery = fQuery.replace(/\|[0-9]{3}/g, );

    fQuery = fQuery.replace(/\|\#/g, '| (in any) #');
    fQuery = fQuery.replace(/\|$/, '| (in any)')
    fQuery = fQuery.replace(/\|/g, '</b>');
    fQuery = fQuery.replace(/(#or,)/g, ' or <b>');
    fQuery = fQuery.replace(/(#and,)/g, ' and <b>');
    fQuery = fQuery.replace(/(#not,)/g, ' not <b>');

    this.formattedSearchTerm = fQuery;
  }

  /**
   * Display "exiting reorder" modal
   */
  public shouldSaveModal(event) {
    if (this.reorderMode && this.showLoseReorder == false) {
      this.showLoseReorder = true;
    }
  }

  /**
   * Set newPage in url and navigate, which triggers this._assets.queryAll() again
   * @param newPage number of desired page
   */
  private goToPage(newPage: number) {
    // The requested page should be within the limits (i.e 1 to totalPages)
    if ( (newPage >= 1) ){
      this._assets.paginated = true;
      this.isLoading = true;
      this.pagination.page = newPage;
      this._assets.goToPage(newPage);
    }
  }

  /**
   * Clear select mode by re-setting the edit flag and clearing the selected assets array
   */
  private deactivateSelectMode() {
    this.editMode = false;
    this.selectedAssets = [];
    this._assets.setSelectedAssets(this.selectedAssets);
  }

  /**
   * Change size of page and go to page=1
   * @param size Number of assets requested on page
   */
  private changePageSize(size: number){
    if (this.pagination.size != size){
      this._assets.goToPage(1, true)
      this._assets.setPageSize(size)
      // this._auth.store('prefs', { pageSize: size })
      let updatedPrefs = Object.assign(this._storage.getLocal('prefs') || {}, { pageSize: size })
      this._storage.setLocal('prefs', updatedPrefs)
    }
  }

  private changeSortOpt(index, label) {
    if ( this.activeSort.index != index){
      this.activeSort.index = index;
      this.activeSort.label = label;

      this._assets.goToPage(1, true);
      this._assets.setSortOpt(index);
    }
  }

  /**
   * Allows to input only numbers [1 - 9]
   * @param event Event emitted on keypress inside the current page number field
   */
  private pageNumberKeyPress(event: any): boolean{
      if ((event.key === 'ArrowUp') || (event.key === 'ArrowDown') || (event.key === 'ArrowRight') || (event.key === 'ArrowLeft') || (event.key === 'Backspace') || (event.key === 'Tab')){
        return true;
      }

      let theEvent = event || window.event;
      let key = theEvent.keyCode || theEvent.which;
      key = String.fromCharCode( key );
      let regex = /[1-9]|\./;
      if ( !regex.test(key) ) {
        theEvent.returnValue = false;
        if (theEvent.preventDefault) theEvent.preventDefault();
      }

      return theEvent.returnValue;
  }

  /**
   * Edit Mode : Selects / deselects an asset - Inserts / Removes the asset object to the selectedAssets array
   * @param asset object to be selected / deselected
   */

  private selectAsset(asset, event?): void {
    if (this.editMode){
      event && event.preventDefault()
      let index: number = this.isSelectedAsset(asset)
      if (index > -1){
        this.selectedAssets.splice(index, 1)
        this._assets.setSelectedAssets(this.selectedAssets)
      }
      else{
        this.selectedAssets.push(asset)
        this._assets.setSelectedAssets(this.selectedAssets)
      }
      this.selectedAssets.length ? this.editMode = true : this.editMode = false
    } else if (asset.compound_media){ // Log GA event for opening a multi view asset from grid
      this.angulartics.eventTrack.next({ properties: { event: 'multiViewItemOpen', category: 'multiview', label: asset.artstorid } });
    }
  }

  private constructNavigationCommands (thumbnail: AssetThumbnail) : any[] {
    let assetId = thumbnail.id
    let params: any = {
      prevRouteTS: this.prevRouteTS // for fetching previous route params from session storage, on asset page
    }
    if(thumbnail.zoom) {
      params['x'] = thumbnail.zoom.viewerX
      params ['y'] = thumbnail.zoom.viewerY
      params['w'] = thumbnail.zoom.pointWidth
      params['h'] = thumbnail.zoom.pointHeight
    }
    let url = []
    thumbnail.iap && (params.iap = 'true')
    this.ig && this.ig.id && (params.groupId = this.ig.id)

    url.push(['/asset', assetId].join('/'))
    url.push(params)
    return url
  }

  /**
   * Toggle Edit Mode
   * - Set up as a function to tie in clearing selection
   */
  private toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (this.editMode == false) {
      // Clear asset selection
      this.selectedAssets = [];
      this._assets.setSelectedAssets(this.selectedAssets);
    }
  }

  /**
   * Toggle Reorder Mode
   * - Set up as a function to toggle the reorder mode
   */
  private toggleReorderMode(): void {
    this.reorderMode = !this.reorderMode;
    this.reordering.emit(this.reorderMode)

    if (this.reorderMode == true) {

      this.showIgDescBool = false

      // Start loading
      this.isLoading = true;

      let itemObjs: any[] = this.itemIds.slice(0)

      this._assets.getAllThumbnails({ itemObjs }, this.igDisplay ? this._igMetaData.id : null)
        .then( allThumbnails => {
          this.isLoading = false;
          this.allResults = allThumbnails
          this.results = this.allResults.slice(0)

          // Construct visible results and invisible results for reordering mode
          this.visibleResults = []
          this.invisibleResults = []
          this.results.forEach(asset => {
            if (asset.status === 'not-available') {
              this.invisibleResults.push(asset)
            }
            else {
              this.visibleResults.push(asset)
            }
          })
        })
        .catch( error => {
          this.isLoading = false;
          this.reorderMode = false;
        });

      // Set focus on the first tumbnail in reorder mode
      setTimeout(() => {
        let el = this._dom.byId('item-0')
        if (el) {
          el.focus()
        }
      }, 600)

    } else {
      this.cancelReorder();
    }
  }

  /**
   * Cancel reordering of assets
   * @requires browser
   */
  private cancelReorder(): void {
    // IE 11 specificially has a caching problem when reloading the group contents
    let isIE11

    if (this.isBrowser) {
      isIE11 = !!window['MSInputMethodContext'] && !!document['documentMode']
    }

    this.reorderMode = false
    this.reordering.emit(this.reorderMode)
    this.goToPage(1)
    // Force refresh
    if (isIE11) {
      // IE 11 needs a full reload
      window.location.reload()
    } else {
      this._assets.clearAssets()
      this._assets.queryAll(this.route.snapshot.params, true)
    }
  }

  private saveReorder(): void {
    this.isLoading = true
    this.results = this.visibleResults.concat(this.invisibleResults)
    this.allResults = this.results

    let newItemsArray: any[] = []
    // Construct the updated array of item objects containing id and zoom if avilable
    for (let i = 0; i < this.allResults.length; i++) {
      if ('id' in this.allResults[i]) {
        let itemObj = { id: this.allResults[i].id }
        if(this.allResults[i]['zoom']) {
          itemObj['zoom'] = this.allResults[i]['zoom']
        }
        newItemsArray.push(itemObj)
      }
    };

    this.ig.items = newItemsArray;
    this._groups.update(this.ig).pipe(
      take(1),
      map(data => {
          this.cancelReorder();
          this.arrowReorderMessage = "Reordered images have been saved successfully"
        }, error => {
          console.error(error);
          this.cancelReorder();
    })).subscribe()
  }

  /**
   * Reorder image group assets with keyboard arrows
   * @param index The array index of the selected asset to move
   * @param event The keyboard key event
   */
  private arrowReorder(index: number, event: KeyboardEvent): void {
    // Turn arrowReorderMode on/off with 'Enter' when on a thumbnail
    if (event.key === "Enter") {
      if (this.arrowReorderMode) {
        this.arrowReorderMode = false
        this.arrowReorderMessage = "Reorder mode off" // aria live region message
      }
      else {
        this.arrowReorderMode = true
        this.arrowReorderMessage = "Reorder mode on" // aria live region message
      }
      return
    }
    // Exit reording back to focus on Save reorder button
    if (event.key === "Escape") {
      this.arrowReorderMode = false
      this._dom.byId('saveReorderButton').focus()
      return
    }
    // Left, Right arrow key reording - Uses splice on allResults array
    if (this.arrowReorderMode) {
      switch(event.key) {

        case "ArrowRight": {
          let removed = this.visibleResults.splice(index, 1)
          this.visibleResults.splice(index + 1, 0, removed[0])
          this.arrowReorderMessage = 'moved to position ' + (index + 2) + ' of ' + this.visibleResults.length // aria live region message
          break
        }
        case "ArrowLeft": {
          if (index > 0) {
            let removed = this.visibleResults.splice(index, 1)
            this.visibleResults.splice(index - 1, 0, removed[0])

            setTimeout(() => {
              let id = 'item-' + (index - 1)
              this._dom.byId(id).focus()
            }, 100)

            this.arrowReorderMessage = 'moved to position ' + (index) + ' of ' + this.visibleResults.length // aria live region message
          }
          break
        }
        default: {
          this.arrowReorderMode = false
          break
        }
      }
      this.orderChanged = true
    }
  }

  /**
   * Edit Mode : Is the asset selected or not
   * @param asset object whose selection / deselection is to be determined
   * @returns index if the asset is already selected, else returns -1
   */
  private isSelectedAsset(asset: any): number{
    let index: number = -1
    let len = this.selectedAssets.length
    for (let i = 0; i < len; i++){
      if (this.selectedAssets[i].id === asset.id){

        // Also consider zoom detail for exact match on assets
        let zoomMatched: boolean = true
        if(asset.zoom){
          let selectedAssetZoomObj = this.selectedAssets[i].zoom ? this.selectedAssets[i].zoom : {}
          if(JSON.stringify(asset.zoom) !== JSON.stringify(selectedAssetZoomObj)){
            zoomMatched = false
          }
        } else if (this.selectedAssets[i].zoom) {
          zoomMatched = false
        }

        if(zoomMatched) {
          index = i
          break
        }
      }
    }
    return index
  }

  private convertCollectionTypes(collectionId: number): string {
    switch (collectionId) {
      case 3:
        return 'personal-asset';
      default:
        return '';
    }
  }

  /**
   * Closes "exiting reorder" modal
   */
  public ditchingReorder(confirmed: number) {
    // Hide modal
    this.showLoseReorder = false;
    if (confirmed === 1) {
        this.saveReorder();
    }
    else if (confirmed === 2) {
        this.cancelReorder();
    }
  }

  /**
   * Sets thumbnail size and makes sure it's saved in prefs
   * @param large boolean indicating whether or not assets are set to large
   */
  private setThumbnailSize(large: boolean): void {
    this.largeThmbView = large
    let updatedPrefs = Object.assign(this._storage.getLocal('prefs') || {}, { largeThumbnails: large })
    this._storage.setLocal('prefs', updatedPrefs)
  }

  /**
   * Returns asset path for linking
   */
  private getAssetPath(asset): string[] {
    let params = ['/asset', asset.id]
    if (this.ig && this.ig.id) {
      params.push({ 'groupId' : this.ig.id })
    }
    return this.editMode ? ['./'] : params
  }

  /**
   * Show checkbox on focus
   */
  private showBox(event): void {
    this._renderer.setElementClass(event.target.parentElement, 'show-box', true);
  }

  /**
   * Hide checkbox on blur
   */
  private hideBox(event): void {
    this._renderer.setElementClass(event.target.parentElement, 'show-box', false);
  }

  /**
   * Remove Assets from a Group
   * - Owner of Group only
   * @requires browser
   */
  private removeFromGroup(assetsToRemove: AssetThumbnail[], clearRestricted?: boolean): void {
    for (let i = 0; i < assetsToRemove.length; i++) {
      let assetId = assetsToRemove[i].id
      let igIndex = this.ig.items.findIndex(item => item.id === assetId)
      // Passing -1 will splice the wrong asset!
      if (igIndex >= 0) {
        this.ig.items.splice(igIndex, 1)
      }
    }
    // Save removal to Group
    this._groups.update(this.ig).pipe(
      take(1),
      map(data => {
          // Reload group after removing assets
          window.location.reload()
        }, error => {
          console.error(error);
    })).subscribe()
  }

  private goToAsset(asset: any): void{
    let assetURLParams: any[] = this.constructNavigationCommands(asset)
    this._router.navigate(assetURLParams)
  }

  private closeGridDropdowns(): void{
    let dropdownElements = Array.from(this._dom.bySelectorAll('ang-asset-grid .dropdown') )
    for (let dropdownElement of dropdownElements){
      dropdownElement.classList.remove('show')
      dropdownElement.children[0].setAttribute('aria-expanded', 'false')
      dropdownElement.children[1].classList.remove('show')
    }
  }

  private injectAdvancedSearchSurvey(): void{
    const scriptSrc = '//ethn.io/62676.js';
    if (document.querySelectorAll(`[src="${scriptSrc}"]`).length === 0) {
      var script = document.createElement('script');
      script.setAttribute('src', scriptSrc);
      document.getElementsByTagName('head')[0].appendChild(script);
    }
  }

  /**
   * Set showIgDescBool to be true when
   * - A description exists
   * - View hasn't changed to hide the description
   * Set animationFinished 400ms after setting showIgDescBool to be true
   * This is to make sure we display the details when animation is finished
   */
  public toggleShowIgDesc(noAnimation?: boolean): void {
    if (!this.showIgDescBool && this.igDisplay && !this.reorderMode) {
      this.showIgDescBool = true;
      if (noAnimation) {
        this.animationFinished = true
      } else {
        setTimeout(()=>{
          this.animationFinished = true
        }, 400)
      }
    } else {
      this.showIgDescBool = false
      this.animationFinished = false
    }
  }

  /**
   * Encode Tag: Encode the tag before using it for search
   */
  public encodeTag(tag) {
    return encodeURIComponent(tag);
  }

  public showEditGroup(): void {
    this._ig.editGroupObservableSource.next(true)
  }

  public createAssetSelectionLabel(asset): string {
    return `Select asset "${asset.name}"`
  }
}
