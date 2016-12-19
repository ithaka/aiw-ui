import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Locker } from 'angular2-locker';
 
@Injectable()
export class AssetFiltersService {

    // Facets
    private geoTree = [];

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
    
    constructor(private locker: Locker){
        
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

    public generateGeoFilters(resGeoFacetsArray){
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
}