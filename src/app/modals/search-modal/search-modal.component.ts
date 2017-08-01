import { Router } from '@angular/router';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Angulartics2 } from 'angulartics2/dist';

// Project dependencies
import { SearchQueryUtil } from './search-query';
import { AssetService } from './../../shared';
import { AnalyticsService } from '../../analytics.service';
import { AssetFiltersService } from './../../asset-filters/asset-filters.service';
import { AuthService } from "app/shared/auth.service";

@Component({
  selector: 'ang-search-modal',
  templateUrl: 'search-modal.component.html',
  styleUrls: [ 'search-modal.component.scss' ]
})
export class SearchModal implements OnInit {
  @Output()
  private closeModal: EventEmitter<any> = new EventEmitter();
  
  public fields = [];

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

  private error: any = {};
  public advanceQueries = [];
  public advanceSearchDate: any = {
    'startDate' : '',
    'startEra' : 'BCE',
    'endDate' : '',
    'endEra' : 'CE'
  }

  private termsList: any = {};
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
  private instName: string = "";
  private instCollections: any[] = [];
  private filterSelections: any[] = [];

  // Search query trasnformation logic is abstracted to a utility
  private queryUtil: SearchQueryUtil = new SearchQueryUtil()

  constructor(  
        private _assets: AssetService, 
        private _filters: AssetFiltersService, 
        private _router: Router,
        private _analytics: AnalyticsService,
        private angulartics: Angulartics2,
        private _auth: AuthService
      ) { 
    // Pull in filterFields
    this.fields = _assets.filterFields;
    
    // Setup two query fields
    this.advanceQueries.push(Object.assign({}, this.advQueryTemplate));
    this.advanceQueries.push(Object.assign({}, this.advQueryTemplate));
    
    // Get GeoTree and Classifications
    this._assets.loadTermList( )
          .then((res) => {
              console.log(res);
              this.termsList = res;
          })
          .catch(function(err) {
              console.error('Unable to load Terms List.');
          });
        
    // Get institutional collections
    this._assets.getCollections('institution')
        .then(
          (data)  => {
            if (data['shortName']) {
              this.instName = data['shortName'];
              this.colTree.push({
                id: 'allSS',
                name: 'Institutional Collections',
                collections: data['Collections']
              });
            }
            
          },
          (error) => {
            console.log(error);
          }
        ).catch(function(err) {
          console.log(err);
        });
  }

  ngOnInit() { 
    document.body.style.overflow = 'hidden';
  }

  private close(): void {
    document.body.style.overflow = 'auto';
    this.closeModal.emit()
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
    if(this.advanceSearchDate[dateEra] == 'BCE'){
      this.advanceSearchDate[dateEra] = 'CE';
    }
    else{
      this.advanceSearchDate[dateEra] = 'BCE';
    }
  }

  private dateKeyPress(event: any): boolean{
      if((event.key == 'ArrowUp') || (event.key == 'ArrowDown') || (event.key == 'ArrowRight') || (event.key == 'ArrowLeft') || (event.key == 'Backspace')){
        return true;
      }

      var theEvent = event || window.event;
      var key = theEvent.keyCode || theEvent.which;
      key = String.fromCharCode( key );
      var regex = /[0-9]|\./;
      if( !regex.test(key) ) {
        theEvent.returnValue = false;
        if(theEvent.preventDefault) theEvent.preventDefault();
      }

      return theEvent.returnValue;
  }

  private resetFilters(): void {
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
  private validateForm(): boolean {
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
    else if(startDate > endDate){
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

  private applyAllFilters(): void {
    if (!this.validateForm()) {
      return;
    }

    let advQuery
    let filterParams

    // Check search feature flag
    if (this._auth.featureFlags['solrSearch']) {
      advQuery = this.queryUtil.generateSearchQuery(this.advanceQueries)
      filterParams = this.queryUtil.generateFilters(this.filterSelections, this.advanceSearchDate)
    } else {
      advQuery = this.queryUtil.generateLegacySearchQuery(this.advanceQueries)
      filterParams = this.queryUtil.generateLegacyFilters(this.filterSelections, this.advanceSearchDate)
    }

    // Track in Adobe Analytics
    this._analytics.directCall('advanced_search');
    this.angulartics.eventTrack.next({ action: "advSearch", properties: { category: "search", label: advQuery } })
    
    // Open search page with new query
    this._router.navigate(['/search', advQuery, filterParams]);

    // Close advance search modal
    this.close();
  }

  private toggleFilter(value: string, group: string): void {
    let filter = {
      'group': group,
      'value' : value
    };
    let objIndex = this.arrayObjectIndexOf(this.filterSelections, filter);
    
    if (objIndex < 0) {
      this.filterSelections.push(filter);
    } else {
      this.filterSelections.splice(objIndex, 1);
    }
    this.validateForm();
  }

  // Gives the index of an object in an array
  private arrayObjectIndexOf(array, searchObj): number {
    for(let i = 0; i < array.length; i++) {
        if ( (array[i].group === searchObj.group) && (array[i].value === searchObj.value) ) return i;
    }
    return -1;
  }

  /**
   * Open Help page on Advanced Search
   */
  private openHelp(): void {
    window.open('http://support.artstor.org/?article=advanced-search','Advanced Search Support','width=800,height=600');
  }
}
