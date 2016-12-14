import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
 
@Injectable()
export class AssetFiltersService {

    // Applied Facets
    // private filters: any;

    // Facets
    // private collTypeFacets = [];
    // private classificationFacets = [];
    // private geographyFacets = [];
    // private dateFacetsArray = [];
    // private geoTree = [];
    
    private facets: any = {
        collType : [],
        classification: [],
        geography: [],
        date : {
            earliest : {
                date : 1000,
                era : 'BCE'
            },
            latest : {
                date : 2016,
                era : 'CE'
            },
            modified : false
        }
    };

    // Observable object sources
    private facetChangeSource = new Subject<any>();
    // Observable object streams
    public facetChange$ = this.facetChangeSource.asObservable();

    constructor(){
        
    }
    
    public setFacets(name: string, facets: any[] ) {
        console.log("Set facets!");
        console.log(facets);
        this.facets[name] = facets;
        this.facetChangeSource.next(this.facets);
    }

    // public getFacets() {
    //     return this.facets;
    // }

    // public setFilters(filters) {
    //     this.filters = filters;
    // }

    // public getFilters() {
    //     return this.filters;
    // }


}