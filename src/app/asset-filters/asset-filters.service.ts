import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/toPromise';
 
@Injectable()
export class AssetFiltersService {

    private filters: any;
    private collTypeFacets = [];
    private classificationFacets = [];
    // private geoTree = [];
    private geographyFacets = [];
    private dateFacetsArray = [];
    
    private facets = {
        geography: [],
        date: [],
        classification: [],
        collType: []
    };

    constructor(private http: Http){
        
    }

    public setFacet(name: String, facets: Array<any>) {
        // this.facets[name] = facets;
    }

    public setFilters(filters) {
        this.filters = filters;
    }

    public getFilters() {
        return this.filters;
    }


}