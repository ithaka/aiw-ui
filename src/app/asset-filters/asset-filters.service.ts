import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Locker } from 'angular2-locker';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/toPromise';

import { AuthService } from '../shared/auth.service';

@Injectable()
export class AssetFiltersService {

    // Facets
    private geoTree = [];

    private appliedFilters: any = [];
    
    private defaultAvailable: any = {
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
                date : 2017,
                era : 'CE'
            },
        modified : false
        },
        prevDateObj : {
            earliest : {
                date : 1000,
                era : 'BCE'
            },
            latest : {
                date : 2016,
                era : 'CE'
            }
        }
    };

    private availableFilters: any = this.defaultAvailable;

    private dateFacet: any = {};
    private dateFacetsArray = [];

    // Observable object sources
    private availableSource = new Subject<any>();
    private appliedSource = new Subject<any>();
    // Observable object streams
    public available$ = this.availableSource.asObservable();
    public applied$ = this.appliedSource.asObservable();
    
    constructor(
        private locker: Locker,
        private http: Http,
        private _auth: AuthService
    ){
        
    }
    
    // Empties all filter objects without publishing them
    public clearApplied():void {
        this.appliedFilters = [];
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

    public isApplied(filterObj) {
        for(var i = 0; i < this.appliedFilters.length; i++){
            var filter = this.appliedFilters[i];
            if((filterObj.filterGroup === filter.filterGroup) && (filterObj.filterValue === filter.filterValue)){
                return true;
            }
        }
        return false;
    }

    // Available Filters is used to determine which parameters are true filter parameters
    // This method returns whether a filter group exists or not
    public isFilterGroup(groupName:string): boolean {
        return this.availableFilters.hasOwnProperty(groupName);
    }

    public remove(filter) {
        let filterIndex = this.appliedFilters.indexOf(filter);
        if (filterIndex >= 0) {
            this.appliedFilters.splice(filterIndex);
            this.appliedSource.next(this.appliedFilters);
        }
    }

    public getApplied(): any[] {
        return this.appliedFilters;
    }

    // public getGeoTree(): any[] {
    //     if (this.locker.get('geoTreeObj')) {
    //         return this.locker.get('geoTreeObj');
    //     } else {
            
    //     }
    // }
    // public setFilters(filters) {
    //     this.filters = filters;
    // }

    // public getFilters() {
    //     return this.filters;
    // }


    public generateDateFacets(dateFacetsArray ?) {
        if (!dateFacetsArray) {
            dateFacetsArray = this.availableFilters.date;
        }

        if(dateFacetsArray.length > 0){
            var startDate = dateFacetsArray[0].date;
            var endDate = dateFacetsArray[dateFacetsArray.length - 1].date;
            
            this.availableFilters.dateObj.earliest.date = Math.abs(startDate);
            this.availableFilters.dateObj.earliest.era = startDate < 0 ? "BCE" : "CE";

            this.availableFilters.dateObj.latest.date = Math.abs(endDate);
            this.availableFilters.dateObj.latest.era = endDate < 0 ? "BCE" : "CE";

            // this.availableFilters.dateObj.modified = false;

            // Fallback date filter values
            this.availableFilters.prevDateObj.earliest.date = Math.abs(startDate);
            this.availableFilters.prevDateObj.earliest.era = startDate < 0 ? "BCE" : "CE";

            this.availableFilters.prevDateObj.latest.date = Math.abs(endDate);
            this.availableFilters.prevDateObj.latest.era = endDate < 0 ? "BCE" : "CE";

            this.setAvailable('date', dateFacetsArray);
            this.setAvailable('dateObj', this.availableFilters.dateObj);
            this.dateFacetsArray = dateFacetsArray;
        }
    }

    public generateGeoFilters(resGeoFacetsArray){
        if (this.geoTree.length < 1) {
            let options = new RequestOptions({ withCredentials: true });
        
            this.http.get(this._auth.getUrl() + '/termslist/', options)
                .toPromise()
                .then(res => {
                    this.geoTree = res.json().geoTree;
                    this.generateGeoFilters(resGeoFacetsArray);
                }, err => {
                    console.error(err);
                });
                
            return;
        }
        var generatedGeoFacets = [];
        var countriesArray = [];
        // Extract Regions
        for(var i = 0; i < resGeoFacetsArray.length; i++){
        var resGeoFacet = resGeoFacetsArray[i];
        var match = false;

        for(var j = 0; j < this.geoTree.length; j++){
            var geoTreeObj = this.geoTree[j];
            if((geoTreeObj.type == 'region') && (resGeoFacet.id == geoTreeObj.nodeId)){
            resGeoFacet.expanded = false;
            resGeoFacet.childrenIds = geoTreeObj.children;
            resGeoFacet.children = [];
            match = true;
            break;
            }
        }

        if(match){
            generatedGeoFacets.push(resGeoFacet);
        }
        else{
            countriesArray.push(resGeoFacet);
        }

        }

        // console.log(countriesArray);

        // Extract Countries
        for(var i = 0; i < countriesArray.length; i++){
        var country = countriesArray[i];

        for(var j = 0; j < generatedGeoFacets.length; j++){
            var generatedGeoFacet = generatedGeoFacets[j];
            if(this.existsInRegion(country.id, generatedGeoFacet.childrenIds)){
            // country.parentId = generatedGeoFacet.id;
            generatedGeoFacet.children.push(country);
            break;
            }
        }

        }


        this.setAvailable('geography', generatedGeoFacets);
    }


    public generateColTypeFacets(idsArray){
        idsArray = this.getUniqueColTypeIds(idsArray);
        var generatedFacetsArray = [];
        for(var i = 0; i < idsArray.length; i++){
        var facetObj = {
            id : idsArray[i],
            label: ''
        };
        if(facetObj.id === '1'){
            facetObj.label = 'Artstor Digital Library';
        }
        else if(facetObj.id === '5'){
            facetObj.label = 'Shared Shelf Commons';
        }
        generatedFacetsArray.push(facetObj);
        }
        
        // this.collTypeFacets = generatedFacetsArray;
        this.setAvailable('collType', generatedFacetsArray); 
    }

    private getUniqueColTypeIds(facetArray){
        var colTypeIds = [];
        for(var i = 0; i < facetArray.length; i++){
        var facetObj = facetArray[i];
        var idArray = facetObj.collectionType.split(',');
        for(var j = 0; j < idArray.length; j++){
            idArray[j] = idArray[j].trim();
            if(colTypeIds.indexOf(idArray[j]) === -1){
            colTypeIds.push(idArray[j]);
            }
        }
        }
        return colTypeIds;
    }

    private existsInRegion(countryId, childerenIds){
        var result = false;
        for(var i = 0; i < childerenIds.length; i++){
            var child = childerenIds[i];
            if(child._reference == countryId){
                result = true;
                break;
            }
        }
        return result;
    }


    /**
     * Term List Service
     * @returns Returns the Geo Tree Object used for generating the geofacets tree.
     */
    // public loadTermList(){
    //     let options = new RequestOptions({ withCredentials: true });
        
    //     return this.http
    //         .get(this._auth.getUrl() + '/termslist/', options)
    //         .map(res => {
    //             this.geoTree = res.json().geoTree;
    //             this.generateGeoFilters();
    //         });
    // }
}