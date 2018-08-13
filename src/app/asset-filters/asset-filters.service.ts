import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject, Observable, Subscription } from 'rxjs/Rx';
import { Locker } from 'angular2-locker';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
        page : 1,
        size : 24,
        sort: '0'
    };

    private availableFilters: any = Object.assign({}, this.defaultAvailable);

    private dateFacet: any = {};
    private dateFacetsArray = [];

    // Observable object sources
    private availableSource = new BehaviorSubject<any>(this.availableFilters);
    private appliedSource = new BehaviorSubject<any>(this.appliedFilters);
    // Observable object streams
    public available$ = this.availableSource.asObservable();
    public applied$ = this.appliedSource.asObservable();

    // 'Search within' boolean flag
    public searchWithin: boolean = false

    private _storage;
    private institution: any = {};


    private filterNameMap: any = {
        'collectiontypes' : {
        1 : 'Artstor Digital Library',
        3 : 'Private Collections',
        5 : 'Public Collections',
        6 : 'Private Collections'
        }
    }

    private subscriptions: Subscription[] = []

    constructor(
        private locker: Locker,
        private http: HttpClient,
        private _auth: AuthService
    ){
        this._storage = locker.useDriver(Locker.DRIVERS.LOCAL);

        this.subscriptions.push(
            this._auth.getInstitution().subscribe(
                institution => {
                    this.filterNameMap['collectiontypes'][2] = this.filterNameMap['collectiontypes'][4] = institution && institution.shortName ? institution.shortName + ' Collections' : 'Institutional Collections';
                }
            )
        )
    }

    ngOnDestroy() {
        // Kill subscriptions
        this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
    }


    public getFilterNameMap(): any {
        return this.filterNameMap
    }

    // Empties all filter objects without publishing them
    public clearApplied(isQuiet ?: boolean): void {
        this.appliedFilters = [];
        if (!isQuiet) {
            this.appliedSource.next(this.appliedFilters);
        }
    }

    public clearAvailable(isQuiet ?: boolean): void {
        this.availableFilters = Object.assign({}, this.defaultAvailable);
        if (!isQuiet) {
            this.availableSource.next(this.availableFilters);
        }
    }

    /**
     * Returns a boolean if unable to add filters to available filters
     */
    public setAvailable(name: string, filters: any ): boolean {
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
      let parsedValue: any
        try { // parse possible array
          parsedValue = JSON.parse(value)
        } catch (err) { // not an array
          parsedValue = value
        }

        let groupExists = false;
        for (let i = 0; i < this.appliedFilters.length; i++){

            if (group === this.appliedFilters[i].filterGroup){
                if (Array.isArray(parsedValue)) {
                    this.appliedFilters[i].filterValue.concat(parsedValue)
                } else if (this.appliedFilters[i].filterValue.indexOf(parsedValue) < 0) {
                    this.appliedFilters[i].filterValue.push(parsedValue);
                }
                groupExists = true;
            }
        }

        if (!groupExists) {
            let filterObj = {
                filterGroup: group,
                filterValue: Array.isArray(parsedValue) ? parsedValue : [parsedValue]
            };
            this.appliedFilters.push(filterObj);
        }

        if (!isQuiet) {
          this.appliedSource.next(this.appliedFilters);
        }
    }

    public isApplied(group: string, filter: any) {
        filter = (group === 'collectiontypes') ? parseInt( filter ) : filter;
        for (let i = 0; i < this.appliedFilters.length; i++){
            let filterObj = this.appliedFilters[i];
            if ((group === filterObj.filterGroup)){
                if (filterObj.filterValue.indexOf(filter) > -1) {
                    return true;
                } else if (filterObj.filterValue == filter) {
                    return true;
                }
            }
        }
        return false;
    }

    // Available Filters is used to determine which parameters are true filter parameters
    // This method returns whether a filter group exists or not
    public isFilterGroup(groupName: string): boolean {
        if ((groupName == 'startDate') || (groupName == 'endDate')){
            return true;
        }
        else{
            return this.availableFilters.hasOwnProperty(groupName);
        }
    }

    public remove(group, filter, isQuiet ?: boolean) {
        let filterRemoved = false;
        filter = (group === 'collectiontypes') ? parseInt( filter ) : filter;
        for (let i = 0; i < this.appliedFilters.length; i++){
            let filterObj = this.appliedFilters[i];
            if ((group === filterObj.filterGroup)){
                let valueIndex = filterObj.filterValue.indexOf(filter);
                if (valueIndex > -1) {
                    filterObj.filterValue.splice(valueIndex, 1);
                    filterRemoved = true;
                } else if (filterObj.filterValue == filter) {
                    filterObj.filterValue = []
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
    public generateDateFacets(dateFacetsArray ?: any[]): void {
        if (!dateFacetsArray && this.availableFilters.date) {
            dateFacetsArray = this.availableFilters.date;
        } else if (!dateFacetsArray) {
            dateFacetsArray = []
        }

        if (dateFacetsArray.length > 0){
            let startDate = dateFacetsArray[0].date;
            let endDate = dateFacetsArray[dateFacetsArray.length - 1].date;

            this.availableFilters.dateObj.earliest.date = Math.abs(startDate);
            this.availableFilters.dateObj.earliest.era = startDate < 0 ? 'BCE' : 'CE';

            this.availableFilters.dateObj.latest.date = Math.abs(endDate);
            this.availableFilters.dateObj.latest.era = endDate < 0 ? 'BCE' : 'CE';

            // this.availableFilters.dateObj.modified = false;

            // Fallback date filter values
            this.availableFilters.prevDateObj.earliest.date = Math.abs(startDate);
            this.availableFilters.prevDateObj.earliest.era = startDate < 0 ? 'BCE' : 'CE';

            this.availableFilters.prevDateObj.latest.date = Math.abs(endDate);
            this.availableFilters.prevDateObj.latest.era = endDate < 0 ? 'BCE' : 'CE';

            this.setAvailable('date', dateFacetsArray);
            this.setAvailable('dateObj', this.availableFilters.dateObj);
            this.dateFacetsArray = dateFacetsArray;
        }
    }

    /**
     * Generate hierarchical facets from SOLR hierarchy object
     */
    public generateHierFacets(facetsObj: any, label: string): any[] {

        let generatedFacets = [];

        for (let label in facetsObj) {
            let resFacet = facetsObj[label] && facetsObj[label].element;
            let childrenObj = facetsObj[label] && facetsObj[label].children;

            if (resFacet) {
                resFacet.name = label
                resFacet.children = []

                for (let childName in childrenObj) {
                    let child = childrenObj[childName].element
                    child.name = childName
                    resFacet.children.push(child)
                }

                generatedFacets.push(resFacet);
            }
        }

        this.setAvailable(label, generatedFacets);

        // Optionally useful to have this value returned
        return generatedFacets
    }


    public generateColTypeFacets(idsArray){
        idsArray = this.getUniqueColTypeIds(idsArray);
        let generatedFacetsArray = [];

        for (let i = 0; i < idsArray.length; i++){
            let facetObj = {
                id : idsArray[i],
                label: ''
            };
            if (facetObj.id === '1'){
                facetObj.label = 'Artstor Digital Library';
            }
            else if (facetObj.id === '5'){
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
        let colTypeIds = [];
        for (let i = 0; i < facetArray.length; i++){
        let facetObj = facetArray[i];
        let idArray = facetObj.collectionType.split(',');
        for (let j = 0; j < idArray.length; j++){
            idArray[j] = idArray[j].trim();
            if (colTypeIds.indexOf(idArray[j]) === -1){
            colTypeIds.push(idArray[j]);
            }
        }
        }
        return colTypeIds;
    }

    private existsInRegion(countryId, childerenIds){
        let result = false;
        for (let i = 0; i < childerenIds.length; i++){
            let child = childerenIds[i];
            if (child._reference == countryId){
                result = true;
                break;
            }
        }
        return result;
    }
}
