import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { Subscription }   from 'rxjs/Subscription';
import { Locker } from 'angular2-locker';

import { AssetService } from '../shared/assets.service';
import { AssetFiltersService } from '../asset-filters/asset-filters.service';
import { AuthService } from '../shared/auth.service';
import { Thumbnail } from './../shared';

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
  filters = [];
  private editMode: boolean = false;
  private selectedAssets: any[] = [];

  // Default show as loading until results have update
  private isLoading: boolean = true;
  private searchError: string = "";

  private baseURL: string = '';
  private imgEncryptId: string = '';
  private usrEncryptId: string = '';
  private showgenImgURLModal: boolean = false;
  private genImgMode: string = 'half';
  private imgURLCopied: boolean = false;
  private copyURLStatusMsg: string = '';
  private copyHTMLStatusMsg: string = '';

  private searchTerm: string = '';
  private totalAssets: string = '';

  @Input()
  private assetCount: number;

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
  // Image group Id
  private igId : string = '';

  private _storage;

  // TypeScript public modifiers
  constructor(
    private _assets: AssetService,
    private _filters: AssetFiltersService,
    private _auth:AuthService,
    private _router: Router,
    private route: ActivatedRoute,
    private locker: Locker
  ) {
      this.baseURL = this._auth.getUrl();
      this._storage = locker.useDriver(Locker.DRIVERS.LOCAL);
  } 

  ngOnInit() {
    this.subscriptions.push(
      this.route.params
      .subscribe((params: Params) => {
                
        // if (params['startDate'] && params['endDate']) {
        //   this.dateFacet.earliest.date = Math.abs(params['startDate']);
        //   this.dateFacet.latest.date = Math.abs(params['endDate']);

        //   if (params['startDate'] < 0) {
        //     this.dateFacet.earliest.era = "BCE";
        //   } else {
        //     this.dateFacet.earliest.era = "CE";
        //   }
        //   if (params['endDate'] < 0) {
        //     this.dateFacet.latest.era = "BCE";
        //   } else {
        //     this.dateFacet.latest.era = "CE";
        //   }

        //   this._filters.setAvailable('dateObj', this.dateFacet);
        // }
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
          // Update results array
          this.results = allResults.thumbnails;
          console.log(allResults);
          if (this.results && this.results.length > 0) {
            // We push an empty array on new search to clear assets
            this.isLoading = false;
          } else {
            this.isLoading = true;
          }
          if(allResults.hasOwnProperty('count')){
            this.totalAssets = allResults.count;
            this.isLoading = false;
          }
        },
        (error) => {
          console.log(error);
          this.isLoading = false;
          this.searchError = "There was a server error loading your search. Please try again later.";
        }
      )
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  /**
   * Set newPage in url and navigate, which triggers this._assets.queryAll() again
   * @param newPage number of desired page
   */
  private goToPage(newPage: number) {
    // The requested page should be within the limits (i.e 1 to totalPages)
    if((newPage >= 1) && (newPage <= this.pagination.totalPages)){

      this.isLoading = true;
      //   this.pagination.currentPage = currentPage;
      this.pagination.currentPage = newPage;
      this._assets.goToPage(newPage);
    }
  }

  /**
   * Change size of page and go to currentPage=1
   * @param pageSize Number of assets requested on page
   */
  private changePageSize(pageSize: number){
    this._assets.goToPage(1, true);
    this._assets.setPageSize(pageSize);
  }

  private changeSortOpt(index, label) {
    this.activeSort.index = index;
    this.activeSort.label = label; 

    // this.pagination.currentPage = 1;
    this._assets.goToPage(1, true);
    this._assets.setSortOpt(index);
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
   * Generate Image URL for the selected image in Edit Mode 
   */
  public generateImgUrl(): void{
      if(this.selectedAssets.length > 0){
        this._assets.genrateImageURL( this.selectedAssets[0].objectId )
          .then((imgURLData) => {
              this._assets.encryptuserId()
                .then((userEncryptData) => {
                  this.imgEncryptId = imgURLData.encryptId;
                  this.usrEncryptId = userEncryptData.encryptId;
                  this.showgenImgURLModal = true;
                })
                .catch(function(err){
                  console.log('Unable to Encrypt userid');
                  console.error(err);
                });
          })
          .catch(function(err) {
              console.log('Unable to generate image URL');
              console.error(err);
          });
      }
      else{
        console.log('No Asset Selected!');
      }
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
      }
      else{
        this.selectedAssets.push(asset);
      }
    }
    else{
      // [routerLink]="editMode ? [] : ['/asset', asset.objectId, {prev: route.snapshot.url} ]" 
      this._storage.set('prevRouteParams', this.route.snapshot.url);
      this._router.navigate(['/asset', asset.objectId]);
    }
    console.log(this.selectedAssets);
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
   * Copies innerText of an element to the clipboard
   * @param id of the field whose innerText is to be copied to the clipboard
   */
  private copyTexttoClipBoard(id: string): void{
    var textArea = document.createElement("textarea");

    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';

    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';

    var element = document.getElementById(id);
    textArea.value = element.textContent;

    document.body.appendChild(textArea);
    textArea.select();

    try {
      var successful = document.execCommand('copy');
      var msg = '';
      
      if(successful){
        msg = 'Successfully Copied!';
      }
      else{
        msg = 'Not able to copy!';
      }

      if(id === 'copyURL'){
        this.copyURLStatusMsg = msg;
        setTimeout(() => {
          this.copyURLStatusMsg = '';
        }, 8000);
      }
      else if(id === 'copyHTML'){
        this.copyHTMLStatusMsg = msg;
        setTimeout(() => {
          this.copyHTMLStatusMsg = '';
        }, 8000);
      }
    } catch (err) {
      console.log('Unable to copy');
    }

    document.body.removeChild(textArea);
  }

  private showHelp(): void{
    window.open('http://support.artstor.org/?article=creating-links','Artstor Support','width=600,height=500');
  }
}
