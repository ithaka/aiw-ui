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

  // TO-DO: Fields should be pulled dynamically!
  public fields = [
    {name: 'Title', value: 101 },
    {name: 'Creator', value: 100 },
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
      { 
        term: '',
        field: {
          'name' : 'in any field',
          'value' : ''
        }
      }
  ];
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

  constructor(  private _assets: AssetService, private _filters: AssetFiltersService, private _router: Router) { 
    this._assets.loadTermList( )
          .then((res) => {
              console.log(res);
              this.termsList = res;
          })
          .catch(function(err) {
              console.error('Unable to load Terms List.');
          });
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
    
  }

  private applyAllFilters(): void {
    let queryString = "";

    this.advanceQueries.forEach( (query, index) => {
      if (!query.field || !query.field.name) {
        return;
      }
      // if (query.filterGroup === 'in any field') {
      //   // add as search term
      // } else {
      //   this._filters.apply(query);
      // }
      // kw=flavin|100#and,untitled|101
      if (index !== 0) {
        queryString += "#and,";
      }

      queryString += query.term + '|' + query.field.value;

      

    });

    console.log(queryString);

    this._router.navigate(['/search', queryString]);
    this.closeModal.emit();
  }
}