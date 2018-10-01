import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer } from '@angular/core'
import { ActivatedRoute, NavigationStart, Params, Router } from '@angular/router'

import { BehaviorSubject } from 'rxjs/Rx'
import { Subscription }   from 'rxjs/Subscription'
import { Locker } from 'angular2-locker'
import { AppConfig } from '../app.service'

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

@Component({
  selector: 'ang-asset-grid',
  styleUrls: [ './asset-grid.component.scss' ],
  templateUrl: './asset-grid.component.pug'
})

export class AssetGrid implements OnInit, OnDestroy {
  // Add user to decide whether to show the banner
  private user: any = this._auth.getUser();

  private siteID: string = ''

  // Set our default values
  private subscriptions: Subscription[] = [];

  public searchLoading: boolean;
  public showFilters: boolean = true;
  public showAdvancedModal: boolean = false;
  errors = {};
  private results: any[] = [];
  // Sometimes we get all the ids but not thumbnails for assets (eg. Groups)
  private itemIds: string[] = [];
  // Array to be filled with *all* assets for reorder mode
  private allResults: any[] = [];
  filters = [];
  private editMode: boolean = false;
  private reorderMode: boolean = false;
  private showLoseReorder: boolean = false;
  private orderChanged: boolean = false;

  private largeThmbView: boolean = false;

  private selectedAssets: any[] = [];

  // Default show as loading until results have update
  private isLoading: boolean = true;
  private searchError: string = '';
  private searchLimitError: boolean = false;

  private searchTerm: string = '';
  private formattedSearchTerm: string = '';
  private searchInResults: boolean = false;
  private isPartialPage: boolean = false;

  // Flag to check if the results have any restricted images.
  private restricted_results: any[] = [];

  private excludedAssetsCount: number = 0;
  private sortByDateTotal: number = 0;

  @Input()
  private actionOptions: any = {};

  // With most pages using Solr, we want to default assuming a max of 5000
  @Input()
  private hasMaxAssetLimit: boolean = true

  // Value
  private totalAssets: number = 0;
  @Input()
  set assetCount(count: number) {
    if (typeof(count) != 'undefined') {
      this.totalAssets = count
    }
  }
  get assetCount(): number {
    return this.totalAssets
  }

  // @Input()
  // private allowSearchInRes:boolean;

  @Output() reordering: EventEmitter<boolean> = new EventEmitter();

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

  private _storage;
  private _session;

  // TypeScript public modifiers
  constructor(
    public _appConfig: AppConfig,
    private _assets: AssetService,
    private _auth: AuthService,
    private _filters: AssetFiltersService,
    private _flags: FlagService,
    private _groups: GroupService,
    private _ig: ImageGroupService,
    private _log: LogService,
    private _renderer: Renderer,
    private _router: Router,
    private _search: AssetSearchService,
    private _toolbox: ToolboxService,
    private locker: Locker,
    private route: ActivatedRoute
  ) {
      this.siteID = this._appConfig.config.siteID;
      this._storage = locker.useDriver(Locker.DRIVERS.LOCAL);
      this._session = locker.useDriver(Locker.DRIVERS.SESSION);
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
      this.route.params
      .subscribe((params: Params) => {
        if (params && params['featureFlag']){
          this._flags[params['featureFlag']] = true
        }

        if (params['term']){
          this.searchTerm = params['term'];
          this.UrlParams.term = this.searchTerm;
        }

        let filterKeysToPass: string [] = [
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
          let filterKey = params[filterKeysToPass[i]]
          if (params[filterKey]) {
            this.UrlParams[filterKey] = params[filterKey]
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
      })
    );

    // Subscribe to pagination values
    this.subscriptions.push(
      this._assets.pagination.subscribe((pagination: any) => {
        this.pagination.page = parseInt(pagination.page);
        this.pagination.size = parseInt(pagination.size);

        const MAX_RESULTS_COUNT: number = APP_CONST.MAX_RESULTS
        if (this.assetCount) {
          let total = this.hasMaxAssetLimit && this.assetCount > MAX_RESULTS_COUNT ? MAX_RESULTS_COUNT : this.assetCount
          this.pagination.totalPages = Math.floor((total + this.pagination.size - 1) / this.pagination.size);
        } else {
          this.pagination.totalPages = parseInt(pagination.totalPages);
        }

        // last page is a partial page
        this.isPartialPage = (this.pagination.page * this.pagination.size) >= (MAX_RESULTS_COUNT - 1)
      })
    );

    /**
     * Subscription to allResults
     * - Provides thumbnails
     * - allResults maintains array of results which persists outside of this component
     */
    this.subscriptions.push(
      this._assets.allResults.subscribe(
        (allResults) => {
          if (this.activeSort.index && this.activeSort.index == '3'){
            this.sortByDateTotal =  allResults.total
            this._search.search(this.UrlParams, this.searchTerm, '0').forEach((res) => {
              this.excludedAssetsCount = res.total - this.sortByDateTotal
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

          this._session.set('totalAssets', this.totalAssets ? this.totalAssets : 1)

          // Tie prevRouteParams array with previousRouteTS (time stamp) before sending to asset page
          this.prevRouteTS = Date.now().toString()
          let id: string = this.prevRouteTS

          let prevRouteParams = this._session.get('prevRouteParams') || {}
          prevRouteParams[id] = this.route.snapshot.url
          this._session.set('prevRouteParams', prevRouteParams)

          //Generate Facets
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
      )
    );

    /**
     * Selected Assets subscription
     * - We want to subscribe to Asset Selection in case another component modifies the collection
     * - (Nav Menu modifies selection)
     */
    this.subscriptions.push(
      this._assets.selection.subscribe(
        selectedAssets => {
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
      )
    );

    this.subscriptions.push(
      this._assets.selectModeToggle.subscribe(() => {
        this.toggleEditMode()
      })
    )

    // Clear all selected assets and close edit mode
    this.subscriptions.push(
      this._assets.clearSelectMode.subscribe( value => {
        if (value){
          this.deactivateSelectMode();
        }
      })
    )
  }

  ngOnDestroy() {
    // Kill subscriptions
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });

    // Clear asset selection
    this._assets.setSelectedAssets([]);
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
      let updatedPrefs = Object.assign(this._storage.get('prefs') || {}, { pageSize: size })
      this._storage.set('prefs', updatedPrefs)
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
      if ((event.key == 'ArrowUp') || (event.key == 'ArrowDown') || (event.key == 'ArrowRight') || (event.key == 'ArrowLeft') || (event.key == 'Backspace')){
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
    if(this.editMode){
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
          this.results = this.allResults = allThumbnails;
        })
        .catch( error => {
          this.isLoading = false;
          this.reorderMode = false;
        });
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

    let newItemsArray = [];

    for (let i = 0; i < this.allResults.length; i++) {
      if ('objectId' in this.allResults[i]) {
        newItemsArray.push(this.allResults[i]['objectId'])
      }
    };

    this.ig.items = newItemsArray;

    this._groups.update(this.ig)
      .take(1)
      .subscribe(
        data => {
          this.cancelReorder();
        }, error => {
          console.error(error);
          this.cancelReorder();
        });
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
   * Format the search term to display advance search queries nicely
   */
  private formatSearchTerm(query: string): void {
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
  private shouldSaveModal(event) {
    if (this.reorderMode && this.showLoseReorder == false) {
      this.showLoseReorder = true;
    }
  }

  /**
   * Closes "exiting reorder" modal
   */
  private ditchingReorder(command) {
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
    let updatedPrefs = Object.assign(this._storage.get('prefs') || {}, { largeThumbnails: large })
    this._storage.set('prefs', updatedPrefs)
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
    for(let i = 0; i < assetsToRemove.length; i++) {
      let assetId = assetsToRemove[i].objectId
      let igIndex = this.ig.items.indexOf(assetId)
      // Passing -1 will splice the wrong asset!
      if (igIndex >= 0) {
        this.ig.items.splice(igIndex, 1)
      }
    }
    // Save removal to Group
    this._groups.update(this.ig)
      .take(1)
      .subscribe(
        data => {
          // Reload group after removing assets
          window.location.reload()
        }, error => {
          console.error(error);
        });
  }
}
