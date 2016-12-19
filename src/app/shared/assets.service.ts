/**
 * Assets service
 */
import { Injectable, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { Subject } from 'rxjs/Subject';
import { Locker } from 'angular2-locker';

import 'rxjs/add/operator/toPromise';
import { Subscription }   from 'rxjs/Subscription';
 
import { AuthService } from '../shared/auth.service';
import { AssetFiltersService } from './../asset-filters/asset-filters.service';

@Injectable()
export class AssetService {

    //set up thumbnail observables
    private allResultsSource = new Subject<any[]>();
    public allResults = this.allResultsSource.asObservable();

    /**
     * urlParams is used as an enum for special parameters
     */
    private urlParams: any;

    private geoTree = [];

    /** Keeps track of all filters available in url */
    private knownFilters: any = {};
    public _storage;

    constructor(
        private _filters: AssetFiltersService,
        private _router: Router,
        private route: ActivatedRoute,
        private http: Http,
        locker: Locker,
        private _auth: AuthService
    ) {
        this._storage = locker;
        this.urlParams = {
            term: "",
            pageSize: 24,
            totalPages: 1,
            currentPage: 1,
            startDate: 0,
            endDate: 0,
            igId: "",
            objectId: "",
            colId: ""
        };
    }

    private readUrlParams() {
        let params = this.route.snapshot.params;

        // Creates filters and list of relevant url parameters for use by search
        for (let param in params) {
            // test if param is a special parameter
            if (this.urlParams.hasOwnProperty(param)) {
                // param is a special parameter - assign the value
                this.urlParams[param] = params[param];
            } else {
                // param is (likely) a filter (or I messed up) - add it to knownFilters
                this.knownFilters[param] = params[param];
            }
        }
    }
    
    private formEncode = function (obj) {
        var encodedString = '';
        for (var key in obj) {
            if (encodedString.length !== 0) {
                encodedString += '&';
            }

            encodedString += key + '=' + encodeURIComponent(obj[key]);
        }
        return encodedString.replace(/%20/g, '+');
    };
    
    private extractData(res: Response) {
        let body = res.json();
        return body || { };
    }

    public queryAll(queryObject: any) {
        this.readUrlParams();

        if (queryObject.hasOwnProperty("igId") && queryObject.hasOwnProperty("objectId")) {
            //gets associated images thumbnails
            this.loadAssociatedAssets(queryObject.objectId, queryObject.colId);
        } else if (queryObject.hasOwnProperty("igId")) {
            //get image group thumbnails
            this.loadIgAssets(queryObject.igId);
        } else if (queryObject.hasOwnProperty("objectId")) {
            //get clustered images thumbnails
            this.loadCluster(queryObject.objectId);
        } else if (queryObject.hasOwnProperty("colId")) {
            //get collection thumbnails
            this.loadCollection(queryObject.colId, 1, 24);
        } else if (queryObject.hasOwnProperty("term")) {
            console.log("beginning search!");
        } else {
            console.log("don't know what to query!");
        }
        
    }

    /**
     * Gets array of thumbnails associated to objectId
     * @param objectId Object Id for which to retrieve image results
     * @param colId Collection Id in which the Object resides
     */
    private loadAssociatedAssets(objectId: string, colId: string) {
        // this.getAssociated(objectId, colId, this.pagination.currentPage, this.pagination.pageSize)
        this.getAssociated(objectId, colId, 1, 24)
            .then((data) => {
                if (!data) {
                throw new Error("No data in image group thumbnails response");
                }
                // this.results = data.thumbnails;
                this.allResultsSource.next(data.thumbnails);
            })
            .catch((error) => {
                console.log(error);
            });
    }

    /**
     * Gets array of thumbnails and sets equal to results
     * @param igId Image group id for which to retrieve thumbnails
     */
    private loadIgAssets(igId: string) {
        this.getFromIgId(igId)
            .then((data) => {
                if (!data) {
                throw new Error("No data in image group thumbnails response");
                }
                // this.allResultsSource = data.thumbnails;
                //notify allResults observers
                this.allResultsSource.next(data.thumbnails);
                console.log(this.allResultsSource);
            })
            .catch((error) => {
                console.log(error);
            });
    }

    /**
     * Loads thumbnails from a collectionType
     * @param colId Collection Id for which to fetch results
     */
    private loadCollection(colId: string, currentPage?: number, pageSize?: number) {
        // this.getCollectionThumbs(colId, currentPage, pageSize)
        this.getCollectionThumbs(colId, currentPage, pageSize)
            .then((data) => {
                console.log(data);
                // this.results = data.thumbnails;
                this.allResultsSource.next(data.thumbnails);
                }
            )
            .catch(error => {
                console.log(error);
            });
    }

    private loadCluster(objectId: string){
        // this.searchLoading = true;
        this.cluster(objectId, {
                index : 0,
                label : 'Relevance'
            })
            .then((res) => {
                console.log(res);
                // this.pagination.totalPages = this.setTotalPages(res.count);
                // this.results = res.thumbnails;
                // this.searchLoading = false;
                if (res.thumbnails) {
                    this.allResultsSource.next(res.thumbnails);
                } else {
                    throw new Error("There are no thumbnails. Server responsed with status " + res.status);
                }
                
            })
            .catch(function(err) {
                // this.errors['search'] = "Unable to load cluster results.";
                // this.searchLoading = false;
                console.log(err);
            });
    }

    private cluster(objectId: string, sortIndex) {
        let options = new RequestOptions({ withCredentials: true });
        let startIndex = ((this.urlParams.currentPage - 1) * this.urlParams.pageSize) + 1;

        //sortIndex was tacked onto this before, but the call was not working
        let requestString = [this._auth.getUrl(), "cluster", objectId, "thumbnails", startIndex, this.urlParams.pageSize].join("/");
        //  + '/cluster/' + objectId + '/thumbnails/' + startIndex + '/' + this.urlParams.pageSize + '/' + sortIndex

        return this.http
            .get(requestString, options)
            .toPromise()
            .then(this.extractData);
    }

    private category(catId: string) {
        let options = new RequestOptions({ withCredentials: true });

        return this.http
            .get(this._auth.getUrl() + '/collections/' + catId + '/categoryroot', options)
            .toPromise()
            .then(this.extractData);
    }

    /**
     * Get Collection
     * @param colId id of collection to fetch
     * @returns thumbnails of assets for a collection, and collection information
     */
    private getCollectionThumbs(colId: string, pageNo?: number, pageSize?: number) {
        let options = new RequestOptions({withCredentials: true});
        let imageSize = 0;
        
        if (!pageNo) { pageNo = 1; }
        if (!pageSize) { pageSize = 72; }

        let requestString = [this._auth.getUrl(), 'collections', colId, 'thumbnails', pageNo, pageSize, imageSize].join('/');

        return this.http
            .get(requestString, options)
            .toPromise()
            .then(this.extractData);
    }   

    /**
     * Term List Service
     * @returns Returns the Geo Tree Object used for generating the geofacets tree.
     */
    private termList(){
        let options = new RequestOptions({ withCredentials: true });
        
        return this.http
            .get(this._auth.getUrl() + '/termslist/', options)
            .toPromise()
            .then(this.extractData)
            .then((res) => {
                this.geoTree = res.geoTree;
            });
            // .catch((err) => {
            //     console.log('Unable to load terms list.');
            //     console.log(err);
            // });
    }

    /**
     * Executes search and sets relevant asset-grid parameters
     */
    private loadSearch(term) {
        // if (!term && this.results === []) {
        // let term = "*";
        // }
        // this.searchLoading = true;

        this.search(term, this.filters, this.activeSort.index, this.dateFacet)
        .then(
            (res) => {
            console.log(res);
            this.generateColTypeFacets( this.getUniqueColTypeIds(res.collTypeFacets) );
            this.generateGeoFacets( res.geographyFacets );
            // this.generateDateFacets( res.dateFacets );
            this._filters.setFacets('classification', res.classificationFacets);
            this.urlParams.totalPages = Math.ceil( res.count / this.urlParams.pageSize );
            this.allResultsSource.next(res.thumbnails);
            // this.results = res.thumbnails;
            // this.searchLoading = false;
        })
        .catch(function(err) {
            // this.errors['search'] = "Unable to load search.";
            this.searchLoading = false;
        });
    }

    private generateColTypeFacets(idsArray){
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
        this._filters.setFacets('collType', generatedFacetsArray); 
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

    private generateGeoFacets(resGeoFacetsArray){
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


        this._filters.setFacets('geography', generatedGeoFacets);
        // this.geographyFacets = generatedGeoFacets;
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

    private generateDateFacets(dateFacetsArray) {
        var startDate = dateFacetsArray[0].date;
        var endDate = dateFacetsArray[dateFacetsArray.length - 1].date;
        
        this.dateFacet.earliest.date = Math.abs(startDate);
        this.dateFacet.earliest.era = startDate < 0 ? "BCE" : "CE";

        this.dateFacet.latest.date = Math.abs(endDate);
        this.dateFacet.latest.era = endDate < 0 ? "BCE" : "CE";

        this.dateFacet.modified = false;

        this._filters.setFacets('date', dateFacetsArray);
        this._filters.setFacets('dateObj', this.dateFacet);
        this.dateFacetsArray = dateFacetsArray;
    }

    /**
     * Search assets service
     * @param term          String to search for.
     * @param filters       Array of filter objects (with filterGroup and filterValue properties)
     * @param sortIndex     An integer representing a type of sort.
     * @param dateFacet     Object with the dateFacet values
     * @returns       Returns an object with the properties: thumbnails, count, altKey, classificationFacets, geographyFacets, minDate, maxDate, collTypeFacets, dateFacets
     */
    private search(term: string, filters, sortIndex, dateFacet) {
        let keyword = encodeURIComponent(term);
        let options = new RequestOptions({ withCredentials: true });
        let startIndex = ((this.urlParams.currentPage - 1) * this.urlParams.pageSize) + 1;
        let thumbSize = 0;
        let type = 6;
        let colTypeIds = '';
        let classificationIds = '';
        let geographyIds = '';

        let earliestDate = '';
        let latestDate = '';

        if(dateFacet.modified){
            earliestDate = dateFacet.earliest.date;
            earliestDate = ( dateFacet.earliest.era == 'BCE' ) ? ( parseInt(earliestDate) * -1 ).toString() : earliestDate;

            latestDate = dateFacet.latest.date;
            latestDate = ( dateFacet.latest.era == 'BCE' ) ? ( parseInt(latestDate) * -1 ).toString() : latestDate;
        }

        for(var i = 0; i < filters.length; i++){ // Applied filters
            if(filters[i].filterGroup === 'collTypes'){ // Collection Types
                colTypeIds = filters[i].filterValue;
            }
            if(filters[i].filterGroup === 'classification'){ // Classification
                if(classificationIds != ''){
                    classificationIds += ',';
                }
                classificationIds += filters[i].filterValue;
            }
            if(filters[i].filterGroup === 'geography'){ // Geography
                if(geographyIds != ''){
                    geographyIds += ',';
                }
                geographyIds += filters[i].filterValue;
            }
        }
        // /search/1/{start_idx}/{page_size}/0?type= 1&kw={keyword}&origKW=&id={collection_ids}&name=All Collections&order={order}&tn={thumbnail_size}
        
        return this.http
            .get(this._auth.getUrl() + '/search/' + type + '/' + startIndex + '/' + this.urlParams.pageSize + '/' + sortIndex + '?' + 'type=' + type + '&kw=' + keyword + '&origKW=&geoIds=' + geographyIds + '&clsIds=' + classificationIds + '&collTypes=' + colTypeIds + '&id=all&name=All%20Collections&bDate=' + earliestDate + '&eDate=' + latestDate + '&dExact=&order=0&isHistory=false&prGeoId=&tn=1', options)
            .toPromise()
            .then(this.extractData);
    }

    private getCollections() {
        let options = new RequestOptions({ withCredentials: true });
        // Returns all of the collections names
        return this.http
            .get(this._auth.getUrl() + '/institutions/', options)
            .toPromise()
            .then(this.extractData);
    }

    /**
     * Gets thumbnails from image group Id
     * @param groupId Id of desired image group
     * @returns Promise, which is resolved with thumbnail data object
     */
    private getFromIgId(groupId: string) {
        let header = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON
        let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option

        return this.http
            .get(this._auth.getUrl() + "/imagegroup/" + groupId + "/thumbnails", options)
            .toPromise()
            .then((data) => { return this.extractData(data); });
    }

    /**
     * Get associated images
     * @param objectId The id of the object for which you want associated items
     * @param colId The id of the collection from which the asset came
     * @param pageNum Value for pagination
     * @param pageSize How many thumbnails per page
     */
    private getAssociated(objectId: string, colId: string, pageNum: number, pageSize: number) {
        let header = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON
        let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option
        let requestRoute: string = this._auth.getUrl() + "/" + ["collaboratoryfiltering", objectId, "thumbnails", pageNum, pageSize].join("/") + "?collectionId=" + colId;
        console.log(requestRoute);

        return this.http
            .get(requestRoute, options)
            .toPromise()
            .then((data) => { return this.extractData(data); });
    }
 
 
}