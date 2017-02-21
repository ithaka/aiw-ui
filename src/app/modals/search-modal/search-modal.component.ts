import { Router } from '@angular/router';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';

// Project dependencies
import { AssetService } from './../../shared/assets.service';
import { AssetFiltersService } from './../../asset-filters/asset-filters.service';

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
  private filterParams: any = {};
  private filterSelections: any[] = [];

  constructor(  private _assets: AssetService, private _filters: AssetFiltersService, private _router: Router) { 
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

  private addNewQuery(query: any, index: number): void{
    if(query.term){
      if(this.advanceQueries.length === (index + 1)){
        let newQuery: any = {};
        newQuery.term = '';
        newQuery.field = 'in any field';
        newQuery.operator = 'AND';
        this.advanceQueries.push(newQuery);
      }
    }
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

  private applyAllFilters(): void {
    let advQuery = "";

    this.advanceQueries.forEach( (query, index) => {
      if (!query.field || !query.field.name || query.term.length < 1) {
        return;
      }
      
      if (index !== 0) {
        advQuery += "#" + query.operator.toLowerCase() + ",";
      }

      advQuery += query.term + '|' + query.field.value;
    });
    // Load filters!
    this.filterParams = {};

    // Apply date filter
    if (this.advanceSearchDate['startDate'] && this.advanceSearchDate['endDate']) {
      this.filterParams['startDate'] = this.advanceSearchDate['startDate'] * (this.advanceSearchDate['startEra'] == 'BCE' ? -1 : 1);
      this.filterParams['endDate'] = this.advanceSearchDate['endDate'] * (this.advanceSearchDate['endEra'] == 'BCE' ? -1 : 1);
    }

    // Apply filters
    let appliedFilters = this._filters.getApplied();

    for (let filter of this.filterSelections) {
      if (this.filterParams[filter.group]) {
        this.filterParams[filter.group].push(filter.value);
      } else {
        this.filterParams[filter.group] = [filter.value];
      }
    }
    
    if (advQuery.length < 1) {
      advQuery = "*";
    }
    
    this._router.navigate(['/search', advQuery, this.filterParams]);

    // this._router.navigate(['/search', advQuery]);
    this.close();
  }

  private toggleFilter(value: string, group: string): void {
    let filter = {
      'group': group,
      'value' : value
    };
    
    if (this.filterSelections.indexOf(filter) < 0) {
      this.filterSelections.push(filter);
    } else {
      this.filterSelections.splice(this.filterSelections.indexOf(filter), 1);
    }
  }
}
