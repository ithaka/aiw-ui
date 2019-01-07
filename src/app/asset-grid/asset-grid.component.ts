import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer } from '@angular/core'
import { ActivatedRoute, NavigationStart, Params, Router } from '@angular/router'

import { BehaviorSubject, Subscription } from 'rxjs'
import { map, take } from 'rxjs/operators'
import { Locker, DRIVERS } from 'angular-safeguard'
import { AppConfig } from '../app.service'
import { Angulartics2 } from 'angulartics2'

import {
  AuthService,
  AssetSearchService,
  AssetService,
  GroupService,
  ImageGroupService,
  LogService,
  Thumbnail,
  ToolboxService,
  FlagService
} from '../shared'
import { AssetFiltersService } from '../asset-filters/asset-filters.service'
import { APP_CONST } from '../app.constants'
import { LockerService } from 'app/_services';
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

  public searchLoading: boolean;
  public showFilters: boolean = true;
  public showAdvancedModal: boolean = false;
  errors = {};
  public results: any[] = [];
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

  // @Input()
  // private allowSearchInRes:boolean;

  @Output() reordering: EventEmitter<boolean> = new EventEmitter();

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
    index : '0',
    label : 'Relevance'
  };
  sub;

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

  // @Output() updateSearchInRes: EventEmitter<boolean> = new EventEmitter();

  private pagination: {
    totalPages: number,
    size: number,
    page: number
  } = {
    totalPages: 1,
    size: 24,
    page: 1
  };

  private UrlParams: any = {
    term: '',
    size: 24,
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
  private ig: any = {};

  // Used as a key to save the previous route params in session storage (incase of image group)
  private prevRouteTS: string = ''

  // TypeScript public modifiers
  constructor(
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
    private _locker: LockerService,
    private route: ActivatedRoute
  ) {
      this.siteID = this._appConfig.config.siteID;
      let prefs = this._auth.getFromStorage('prefs')
      if (prefs && prefs.pageSize && prefs.pageSize != 24) {
        this.pagination.size = prefs.pageSize
        this._router.navigate(
          ['.', this._toolbox.addToParams({ size: prefs.pageSize }, this.route.snapshot.params )],
          { relativeTo: this.route }
        )
      }
      if (prefs && prefs.largeThumbnails) {
        this.largeThmbView = prefs.largeThumbnails
      }
  }

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
        if (params && params['featureFlag']){
          this._flags[params['featureFlag']] = true
        }

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
          if ( (this.activeSort.index && this.activeSort.index == '3') || (this.UrlParams['startDate'])) {
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
            this.searchError = 'There was a server error loading your search. Please try again later.'
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

          this._locker.sessionSet('totalAssets', this.totalAssets ? this.totalAssets : 1)

          // Tie prevRouteParams array with previousRouteTS (time stamp) before sending to asset page
          this.prevRouteTS = Date.now().toString()
          let id: string = this.prevRouteTS

          let prevRouteParams = this._locker.sessionGet('prevRouteParams') || {}
          prevRouteParams[id] = this.route.snapshot.url
          this._locker.sessionSet('prevRouteParams', prevRouteParams)

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
  }

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
      let updatedPrefs = Object.assign(this._locker.get('prefs') || {}, { pageSize: size })
      this._locker.set('prefs', updatedPrefs)
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
      this.angulartics.eventTrack.next({ action: 'multiViewItemOpen', properties: { category: this._auth.getGACategory(), label: asset.artstorid } });
    }
  }

  private constructNavigationCommands (thumbnail: Thumbnail) {
    let assetId = thumbnail.objectId ? thumbnail.objectId : thumbnail.artstorid
    let params: any = {
      prevRouteTS: this.prevRouteTS // for fetching previous route params from session storage, on asset page
    }
    thumbnail.iap && (params.iap = 'true')
    this.ig && this.ig.id && (params.groupId = this.ig.id)

    let url = ['/#/asset', assetId].join('/')
    for (let key in params) {
      url = url.concat([';', key, '=', params[key]].join(''))
    }
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
    this.reordering.emit(this.reorderMode);

    if (this.reorderMode == true) {
      // Start loading
      this.isLoading = true;

      this._assets.getAllThumbnails(this.itemIds)
        .then( allThumbnails => {
          this.isLoading = false;
          // Make sure we are only reordering Available assets
          allThumbnails = allThumbnails.filter(thumbnail => {
            return thumbnail.status === 'available'
          })
          this.allResults = allThumbnails
          this.results = this.allResults.slice(0)
        })
        .catch( error => {
          this.isLoading = false;
          this.reorderMode = false;
        });

      // Set focus on the first tumbnail in reorder mode
      setTimeout(() => {
        let el = document.getElementById('item-0')
        el.focus()
      }, 600)

    } else {
      this.cancelReorder();
    }
  }

  private cancelReorder(): void {
    // IE 11 specificially has a caching problem when reloading the group contents
    let isIE11 = !!window['MSInputMethodContext'] && !!document['documentMode']
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
    this.isLoading = true;
    this.allResults = this.results

    let newItemsArray = [];

    for (let i = 0; i < this.allResults.length; i++) {
      if ('objectId' in this.allResults[i]) {
        newItemsArray.push(this.allResults[i]['objectId'])
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
      document.getElementById('saveReorderButton').focus()
      return
    }
    // Left, Right arrow key reording - Uses splice on allResults array
    if (this.arrowReorderMode) {
      switch(event.key) {

        case "ArrowRight": {
          let removed = this.results.splice(index, 1)
          this.results.splice(index + 1, 0, removed[0])
          this.arrowReorderMessage = 'moved to position ' + (index + 2) + ' of ' + this.results.length // aria live region message
          break
        }
        case "ArrowLeft": {
          if (index > 0) {
            let removed = this.results.splice(index, 1)
            this.results.splice(index - 1, 0, removed[0])

            setTimeout(() => {
              let id = 'item-' + (index - 1)
              document.getElementById(id).focus()
            }, 100)

            this.arrowReorderMessage = 'moved to position ' + (index) + ' of ' + this.results.length // aria live region message
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
    let assetIdProperty =  'artstorid'

    // some services return assets with objectId instead of artstorid, so check the first one and use that
    if (this.selectedAssets[0] && !this.selectedAssets[0].hasOwnProperty('artstorid')) {
      assetIdProperty = 'objectId'
    }
    let len = this.selectedAssets.length
    for (let i = 0; i < len; i++){
      if (this.selectedAssets[i][assetIdProperty] === asset[assetIdProperty]){
        index = i
        break
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
  public ditchingReorder(command) {
    // Hide modal
    this.showLoseReorder = false;
    if (command.includes('Save')) {
      this.saveReorder();
    } else if (command.includes('Discard')) {
      this.cancelReorder();
    } else {
      // Return to Reorder
    }
  }

  /**
   * Sets thumbnail size and makes sure it's saved in prefs
   * @param large boolean indicating whether or not assets are set to large
   */
  private setThumbnailSize(large: boolean): void {
    this.largeThmbView = large
    let updatedPrefs = Object.assign(this._locker.get('prefs') || {}, { largeThumbnails: large })
    this._locker.set('prefs', updatedPrefs)
  }

  /**
   * Returns asset path for linking
   */
  private getAssetPath(asset): string[] {
    let params = ['/asset', asset.objectId ? asset.objectId : asset.artstorid]
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
   */
  private removeFromGroup(assetsToRemove: Thumbnail[], clearRestricted?: boolean): void {
    for (let i = 0; i < assetsToRemove.length; i++) {
      let assetId = assetsToRemove[i].objectId
      let igIndex = this.ig.items.indexOf(assetId)
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
    let assetURL: string = this.constructNavigationCommands(asset)
    this._router.navigateByUrl(assetURL.replace('/#', ''))
  }

  private closeGridDropdowns(): void{
    let dropdownElements: Array<HTMLElement> = Array.from( document.querySelectorAll('ang-asset-grid .dropdown') )
    for (let dropdownElement of dropdownElements){
      dropdownElement.classList.remove('show')
      dropdownElement.children[0].setAttribute('aria-expanded', 'false')
      dropdownElement.children[1].classList.remove('show')
    }
  }
}
