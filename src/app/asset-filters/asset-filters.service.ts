import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
 
@Injectable()
export class AssetFiltersService {

    // Facets
    // private geoTree = [];

    private appliedFilters: any = [];
    
    private availableFilters: any = {
        collType : [],
        classification: [],
        geography: [],
        date: [],
        dateObj : {
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

    private dateFacet: any = {};
    private dateFacetsArray = [];

    // Observable object sources
    private availableSource = new Subject<any>();
    private appliedSource = new Subject<any>();
    // Observable object streams
    public available$ = this.availableSource.asObservable();
    public applied$ = this.appliedSource.asObservable();

    constructor(){
        
    }
    
    public setAvailable(name: string, filters: any ) {
        this.availableFilters[name] = filters;
        this.availableSource.next(this.availableFilters);
    }

    public getAvailable(): any {
        return this.availableFilters;
    }

    public apply(filter) {
        this.appliedFilters.push(filter);
        this.appliedSource.next(this.appliedFilters);
    }

    public getApplied(): any[] {
        return this.appliedFilters;
    }

    // public setFilters(filters) {
    //     this.filters = filters;
    // }

    // public getFilters() {
    //     return this.filters;
    // }


    private generateDateFacets(dateFacetsArray) {
        var startDate = dateFacetsArray[0].date;
        var endDate = dateFacetsArray[dateFacetsArray.length - 1].date;
        
        this.dateFacet.earliest.date = Math.abs(startDate);
        this.dateFacet.earliest.era = startDate < 0 ? "BCE" : "CE";

        this.dateFacet.latest.date = Math.abs(endDate);
        this.dateFacet.latest.era = endDate < 0 ? "BCE" : "CE";

        this.dateFacet.modified = false;

        this.setAvailable('date', dateFacetsArray);
        this.setAvailable('dateObj', this.dateFacet);
        this.dateFacetsArray = dateFacetsArray;
    }

}