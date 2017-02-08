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
  
  public fields = [
    {name: "In any field", value: "all"},
    {name: "Creator", value: "100" },
    {name: "Title", value: "101" },
    {name: "Location", value: "102" },
    {name: "Repository", value: "103" },
    {name: "Subject", value: "104" },
    {name: "Material", value: "105" },
    {name: "Style or Period", value: "106" },
    {name: "Work Type", value: "107" },
    {name: "Culture", value: "108" },
    {name: "Description", value: "109" },
    {name: "Technique", value: "110" },
    {name: "Number", value: "111" }
  ];

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

  constructor(  private _assets: AssetService, private _filters: AssetFiltersService, private _router: Router) { 
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
     // Setup two query fields
    this.advanceQueries.push(Object.assign({}, this.advQueryTemplate));
    this.advanceQueries.push(Object.assign({}, this.advQueryTemplate));
  }

  private applyAllFilters(): void {
    let advQuery = "";

    this.advanceQueries.forEach( (query, index) => {
      if (!query.field || !query.field.name || query.term.length < 1) {
        return;
      }
      // if (query.filterGroup === 'in any field') {
      //   // add as search term
      // } else {
      //   this._filters.apply(query);
      // }
      // kw=flavin|100#and,untitled|101
      if (index !== 0) {
        advQuery += "#" + query.operator.toLowerCase() + ",";
      }

      advQuery += query.term + '|' + query.field.value;
    });

    // Load filters!
    this.filterParams = {};
    let appliedFilters = this._filters.getApplied();

    for (let filter of appliedFilters) {
      if(filter.filterGroup == 'currentPage'){
        this.filterParams[filter.filterGroup] =  parseInt(filter.filterValue);
      } else if(filter.filterValue && (filter.filterGroup != 'startDate') && (filter.filterGroup != 'endDate')){
        this.filterParams[filter.filterGroup] =  filter.filterValue;
      }
    }

    if (advQuery.length < 1) {
      advQuery = "*";
    }
    this.filterParams['term'] = advQuery;
    
    // console.log(this.filterParams);
    this._router.navigate(['/search', this.filterParams]);

    // this._router.navigate(['/search', advQuery]);
    this.close();
  }

  private toggleFilter(value, group): void{
    let filter = {
      filterGroup : group,
      filterValue : value
    };

    if(this._filters.isApplied(filter)){ // Remove Filter
      this._filters.remove(filter);
    } else { // Add Filter
      this._filters.apply(filter);
    }
    
    console.log( this._filters.getApplied() );
    // this.loadRoute();
  }
}

// if (curSearchData.kw.indexOf("|")<0){
// 					curSearchData.kw = curSearchData.kw+'|all'; //Fix for issue GWS-858 - Search different terms within this search result 
// 				}
// 				if ((curSearchData.kw.indexOf("#or")>0) && (curSearchData.kw.indexOf("#WITHIN")<0)){
// 					newKw = curSearchData.kw + '#WITHIN,' + keyword + '|all'; //Fix for issue GWS-886 - Production issue: After Adv search with value "OR" then search in "Within the search result" again, the search result will not matched with search value.
// 					newOrigKW = curSearchData.origKW + '#WITHIN,' + origKW + '|all';//for interntlization
// 				} else {
// 					newKw = curSearchData.kw + '#and,' + keyword + '|all';
// 					newOrigKW = curSearchData.origKW + '#and,' + origKW + '|all';//for interntlization
// 				}

	// if (data.kw!=undefined){
	// 							kw=data.kw;
	// 							//kw=kw.replace(/(\|all)/g," (in any field),");
	// 							kw=kw.replace(/(\|all)/g,",");
								
	// 							kw=kw.replace(/(\#and\,)/g,' "and" ');
	// 							kw=kw.replace(/(\#or,)/g,' "or" ');
	// 							kw=kw.replace(/(\#not,)/g,' "not" ');
	// 							if (kw.charAt(kw.length-1)==","){
									
	// 								var word=kw.substring(0,kw.length-1);
	// 								//console.log("*****KW "+word);
	// 								kw=word;
	// 							}
	// 						}
	// 						var bDate="";
	// 						var eDate="";
	// 						if (data.bDate==undefined){
								
	// 						}
	// 						else {
	// 							bDate=data.bDate;
								
	// 						}
	// 						if (data.eDate==undefined){
								
	// 						}
	// 						else {
	// 							eDate=data.eDate;
								
	// 						}
	// 						var dExact="";
	// 						if (data.dExact==undefined){
								
	// 						}
	// 						else {
	// 							dExact=data.dExact;
								
	// 						}
	// 						var prGeoId="";
	// 						if (data.prGeoId==undefined){
								
	// 						}
	// 						else {
	// 							prGeoId=data.prGeoId;
								
	// 						}
	// 						this.SSArray.splice(0,0,{"title":title,"recCount":recCount,"url":hash, "bDate":bDate,"clsids":classif,"dExact":dExact,"eDate":eDate,"geoIds":geoIds,

	// 							"id":colls,"kw":kw,"prGeoId":prGeoId,"type":data.type,"name":coll,"savedDate":this.newDate, "collTypes":collTypes});

	// 						//thumbStatusMsg("searchSaved");	
	// 						this.check4SScroll(ul);
	// 						//this.saveMySearch();

// /ase "SAHARA":
// 								
// 								 break;
// 							 case "Archaeo":
// 								label1="Site Name";
// 								label2="Artifact Title";
// 								label3="Site Mod. Location";
// 									break;    
// 							 case "FLEXspace":
// 								 label1="Campus";
// 								 label2="Space Design Type";
// 								 label3="Space Date of Service...";
								
// 								 break;
								
// 							  default:
// 								var label1="Title";
// 								var label2="Creator";
// 								var label3="";	
// 								break; 