import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable, BehaviorSubject } from 'rxjs/Rx';
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
        collTypes : [],
        collectiontypes : [],
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
                date : 2017,
                era : 'CE'
            }
        },
        currentPage : 1,
        pageSize : 24,
        sort: "0"
    };

    private availableFilters: any = Object.assign({},this.defaultAvailable);

    private dateFacet: any = {};
    private dateFacetsArray = [];

    // Observable object sources
    private availableSource = new BehaviorSubject<any>(this.availableFilters);
    private appliedSource = new BehaviorSubject<any>(this.appliedFilters);
    // Observable object streams
    public available$ = this.availableSource.asObservable();
    public applied$ = this.appliedSource.asObservable();
    
    private _storage;
    private institution: any = {};

    constructor(
        private locker: Locker,
        private http: Http,
        private _auth: AuthService
    ){
        this._storage = locker.useDriver(Locker.DRIVERS.LOCAL);
        this.institution = this._storage.get('institution');
    }
    
    // Empties all filter objects without publishing them
    public clearApplied(isQuiet ?: boolean):void {
        this.appliedFilters = [];
        if (!isQuiet) {
            this.appliedSource.next(this.appliedFilters);
        }
    }

    public clearAvailable(isQuiet ?: boolean):void {
        this.availableFilters = Object.assign({},this.defaultAvailable);
        if (!isQuiet) {
            this.availableSource.next(this.availableFilters);
        }
    }

    /**
     * Returns a boolean if unable to add filters to available filters
     */
    public setAvailable(name: string, filters: any ) : boolean {
        // if (name == 'geography') {
        //     let filterKeys = (Object.keys(filters) && Object.keys(filters).length > 0) ? Object.keys(filters) : []
        //     let filterArr = []
        //     for (let i = 0; i < filterKeys.length; i++) {
        //         filterArr.push({ name: filterKeys[i], efq: filters[filterKeys[i]].efq, count: filters[filterKeys[i]].count })
        //     }
        //     this.availableFilters[name] = filterArr
        //     console.log(filterArr)
        //     this.availableSource.next(this.availableFilters)
        //     return true
        // } else 
        if (name && name.length > 0 && Object.prototype.toString.call(filters) === '[object Array]') {
            this.availableFilters[name] = filters
            this.availableSource.next(this.availableFilters)
            return true
        }  else if (name == 'dateObj')  {
            // Provide exceptions for non-array filter formats
            this.availableFilters[name] = filters
            this.availableSource.next(this.availableFilters)
            return true
        } else {
            return false
        }
    }

    public getAvailable(): any {
        return this.availableFilters;
    }

    public apply(group: string, value: string, isQuiet ?: boolean) {
        let groupExists = false;
        for(let i = 0; i < this.appliedFilters.length; i++){

            if(group === this.appliedFilters[i].filterGroup){
                if (this.appliedFilters[i].filterValue.indexOf(value) < 0) {
                    this.appliedFilters[i].filterValue.push(value);
                }
                groupExists = true;
            }
        }

        if (!groupExists) {
            let filterObj = {
                filterGroup: group,
                filterValue: [value]
            };
            this.appliedFilters.push(filterObj);
        }

        if (!isQuiet) {
          this.appliedSource.next(this.appliedFilters);
        } 
    }

    public isApplied(group: string, filter: any) {
        for(var i = 0; i < this.appliedFilters.length; i++){
            var filterObj = this.appliedFilters[i];
            if((group === filterObj.filterGroup)){
                if (filterObj.filterValue.indexOf(filter) > -1) {
                    return true;
                }
            }
        }
        return false;
    }

    // Available Filters is used to determine which parameters are true filter parameters
    // This method returns whether a filter group exists or not
    public isFilterGroup(groupName:string): boolean {
        if((groupName == 'startDate') || (groupName == 'endDate')){
            return true;
        }
        else{
            return this.availableFilters.hasOwnProperty(groupName);
        }
    }

    public remove(group, filter, isQuiet ?: boolean) {
        let filterRemoved = false;
        for(var i = 0; i < this.appliedFilters.length; i++){
            var filterObj = this.appliedFilters[i];
            if((group === filterObj.filterGroup)){
                let valueIndex = filterObj.filterValue.indexOf(filter);
                if (valueIndex > -1) {
                    filterObj.filterValue.splice(valueIndex, 1);
                    filterRemoved = true;
                }
            }
        }

        if (filterRemoved && !isQuiet) {
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

    /**
     * Populates the "dateObj" on this.availableFilters for applying/displaying date constraints
     * @param dateFacetsArray Array returned with search results with multiple data and era values
     */
    public generateDateFacets(dateFacetsArray ?: any[]) : void {
        if (!dateFacetsArray && this.availableFilters.date) {
            dateFacetsArray = this.availableFilters.date;
        } else if(!dateFacetsArray) {
            dateFacetsArray = []
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

    /**
     * DEPRECATED: Geo filter generation for old search
     */
    public generateGeoFilters(resGeoFacetsArray){
        if (this.geoTree.length < 1) {
            let options = new RequestOptions({ withCredentials: true });
        
            this.http.get(this._auth.getUrl(true) + '/termslist/', options)
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

    /**
     * Generate hierarchical facets from SOLR hierarchy object
     */
    public generateHierFacets(facetsObj: any, label: string){
        
        var generatedFacets = [];

        for(let label in facetsObj) {
            var resFacet = facetsObj[label];
            if (resFacet.element) {
                resFacet.element.name = label
                generatedFacets.push(resFacet.element);
            }
            // TO-DO: Process children elements on resFacet
        }

        this.setAvailable(label, generatedFacets);
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
            else{
                facetObj.label = this.institution && this.institution.shortName ? this.institution.shortName : 'Institutional';
                facetObj.label += ' Collections';
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
    //         .get(this._auth.getUrl(true) + '/termslist/', options)
    //         .map(res => {
    //             this.geoTree = res.json().geoTree;
    //             this.generateGeoFilters();
    //         });
    // }
}