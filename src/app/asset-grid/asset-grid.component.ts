import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, NavigationStart, Params, Router } from '@angular/router';

import { BehaviorSubject } from 'rxjs/Rx';
import { Subscription }   from 'rxjs/Subscription';
import { Locker } from 'angular2-locker';

import { AssetService, ImageGroupService, GroupService, Thumbnail } from '../shared';
import { AssetFiltersService } from '../asset-filters/asset-filters.service';
import { AuthService } from '../shared/auth.service';

@Component({
  selector: 'ang-asset-grid', 
  providers: [],
  styleUrls: [ './asset-grid.component.scss' ],
  templateUrl: './asset-grid.component.html'
})

export class AssetGrid implements OnInit, OnDestroy {
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

  private selectedAssets: any[] = [];
  
  // Default show as loading until results have update
  private isLoading: boolean = true;
  private searchError: string = "";

  private searchTerm: string = '';
  private totalAssets: string = '';

  @Input()
  private actionOptions: any = {};

  @Input()
  private assetCount: number;

  @Output() reordering: EventEmitter<boolean> = new EventEmitter();

  private pagination: any = {
    totalPages: 1,
    pageSize: 24,
    currentPage: 1
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

  // Object Id parameter, for Clusters
  private objectId : string = ''; 
  // Collection Id parameter
  private colId : string = '';
  // Image group 
  private ig : any = {};

  private _storage;

  // TypeScript public modifiers
  constructor(
    private _assets: AssetService,
    private _ig: ImageGroupService,
    private _groups: GroupService,
    private _filters: AssetFiltersService,
    private _auth:AuthService,
    private _router: Router,
    private route: ActivatedRoute,
    private locker: Locker
  ) {
      this._storage = locker.useDriver(Locker.DRIVERS.LOCAL);
  } 

  ngOnInit() {
    // Subscribe to asset search params
    this.subscriptions.push(
      this.route.params
      .subscribe((params: Params) => {
        
        if(params['term']){
          this.searchTerm = params['term'];
        }

        if(params['sort']){
          this.activeSort.index = params['sort'];

          if(this.activeSort.index == '0'){
            this.activeSort.label = 'Relevance';
          }
          else if(this.activeSort.index == '1'){
            this.activeSort.label = 'Title';
          }
          else if(this.activeSort.index == '2'){
            this.activeSort.label = 'Creator';
          }
          else if(this.activeSort.index == '3'){
            this.activeSort.label = 'Date';
          }
        }
        
        if(params['igId'] && !params['currentPage']){
          this.editMode = false;
          this.selectedAssets = [];
          this._assets.setSelectedAssets(this.selectedAssets);
        }
        
        this.isLoading = true;
      })
    );

    // Subscribe to pagination values
    this.subscriptions.push(
      this._assets.pagination.subscribe((pagination: any) => {
        this.pagination.currentPage = parseInt(pagination.currentPage);
        if (this.assetCount) {
          this.pagination.totalPages = Math.floor(this.assetCount/parseInt(pagination.pageSize)) + 1;
        } else {
          this.pagination.totalPages = parseInt(pagination.totalPages);
        }
        this.pagination.pageSize = parseInt(pagination.pageSize);
      })
    );

    // sets up subscription to allResults, which is the service providing thumbnails
    this.subscriptions.push(
      this._assets.allResults.subscribe(
        (allResults: any) => {
          console.log(allResults)
          // Update results array
          this.results = allResults.thumbnails;
          if ('items' in allResults) {
            this.itemIds = allResults.items;
            this.ig = allResults;
          }
          
          if (this.results && this.results.length > 0) {
            this.isLoading = false;
          } else {
            // We push an empty array on new search to clear assets
            this.isLoading = true;
          }
          if('count' in allResults){
            this.totalAssets = allResults.count;
            this.isLoading = false;
          } else if(this.assetCount){
            this.totalAssets = this.assetCount.toString();
            this.isLoading = false;
          }
        },
        (error) => {
          console.error(error);
          this.isLoading = false;
          this.searchError = "There was a server error loading your search. Please try again later.";
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
    if((newPage >= 1) && (newPage <= this.pagination.totalPages)){
      this.isLoading = true;
      this.pagination.currentPage = newPage;
      this._assets.goToPage(newPage);
    }
  }

  /**
   * Change size of page and go to currentPage=1
   * @param pageSize Number of assets requested on page
   */
  private changePageSize(pageSize: number){
    if(this.pagination.pageSize != pageSize){
      this._assets.goToPage(1, true);
      this._assets.setPageSize(pageSize);
    }
  }

  private changeSortOpt(index, label) {
    if( this.activeSort.index != index){
      this.activeSort.index = index;
      this.activeSort.label = label; 

      // this.pagination.currentPage = 1;
      this._assets.goToPage(1, true);
      this._assets.setSortOpt(index);
    }
  }

  /**
   * Allows to input only numbers [1 - 9] 
   * @param event Event emitted on keypress inside the current page number field
   */
  private pageNumberKeyPress(event: any): boolean{
      if((event.key == 'ArrowUp') || (event.key == 'ArrowDown') || (event.key == 'ArrowRight') || (event.key == 'ArrowLeft') || (event.key == 'Backspace')){
        return true;
      }

      var theEvent = event || window.event;
      var key = theEvent.keyCode || theEvent.which;
      key = String.fromCharCode( key );
      var regex = /[1-9]|\./;
      if( !regex.test(key) ) {
        theEvent.returnValue = false;
        if(theEvent.preventDefault) theEvent.preventDefault();
      }

      return theEvent.returnValue;
  }

  /**
   * Edit Mode : Selects / deselects an asset - Inserts / Removes the asset object to the selectedAssets array 
   * @param asset object to be selected / deselected
   */
  private selectAsset(asset: any): void{
    if(this.editMode){
      let index: number = this.isSelectedAsset(asset);
      if(index > -1){
        this.selectedAssets.splice(index, 1);
        this._assets.setSelectedAssets(this.selectedAssets);
      }
      else{
        this.selectedAssets.push(asset);
        this._assets.setSelectedAssets(this.selectedAssets);
      }
    }
    else{
      // [routerLink]="editMode ? [] : ['/asset', asset.objectId, {prev: route.snapshot.url} ]" 
      this._storage.set('totalAssets', this.totalAssets);
      this._storage.set('prevRouteParams', this.route.snapshot.url);
      this._router.navigate(['/asset', asset.objectId]);
    }
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
          this.allResults = allThumbnails;
          this.results = this.allResults;
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
    this.reorderMode = false;
    this.reordering.emit(this.reorderMode);
    this.goToPage(1);
    // Force refresh
    this._assets.clearAssets();
    this._assets.queryAll(this.route.snapshot.params, true);
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
    let index: number = -1;
    for(var i = 0; i < this.selectedAssets.length; i++){
      if(this.selectedAssets[i].objectId === asset.objectId){
        index = i;
        break;
      }
    }
    return index;
  }

  private convertCollectionTypes(collectionId: number) : string {
    switch (collectionId) {
      case 3:
        return "personal-asset";
      default:
        return "";
    }
  }

  /**
   * Format the search term to display advance search queries nicely
   */
  private formatSearchTerm(query: string) : string {
    let fQuery = '<b>' + query;
    // Cleanup filter pipes
    // fQuery = fQuery.replace(/\|[0-9]{3}/g, );
    // Add field names
    this._assets.filterFields.forEach(field => {
      fQuery = fQuery.replace(field.value, ' (in ' + field.name + ')');
    });
    fQuery = fQuery.replace(/\|\#/g, '| (in any) #');
    fQuery = fQuery.replace(/\|/g, '</b>');
    fQuery = fQuery.replace(/(#or,)/g, ' or <b>');
    fQuery = fQuery.replace(/(#and,)/g, ' and <b>');
    fQuery = fQuery.replace(/(#not,)/g, ' not <b>');
    return fQuery;
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
}
